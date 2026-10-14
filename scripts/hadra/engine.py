"""Adaptateur F5-TTS pour la révision vérifiée de HADRA ; cible latine directe."""

import hashlib
from pathlib import Path

from catalog import file_sha256, latin_prompt


def verify_download(path: Path, descriptor: dict) -> None:
    expected_size = descriptor.get("size")
    if expected_size is not None and path.stat().st_size != expected_size:
        raise ValueError(f"Taille inattendue pour {path.name}")
    if descriptor.get("lfs", {}).get("sha256"):
        if file_sha256(path) != descriptor["lfs"]["sha256"]:
            raise ValueError(f"SHA-256 incorrect pour {path.name}")
    else:
        content = path.read_bytes()
        digest = hashlib.sha1(b"blob " + str(len(content)).encode() + b"\0" + content).hexdigest()
        if digest != descriptor.get("blobId"):
            raise ValueError(f"Empreinte Git incorrecte pour {path.name}")


class HadraEngine:
    def __init__(self, spec: dict, reference_audio: Path, reference_text: str, device: str, threads: int = 2):
        import torch
        from huggingface_hub import hf_hub_download
        from f5_tts.infer.utils_infer import load_model, load_vocoder, preprocess_ref_audio_text
        from f5_tts.model import DiT

        if device == "cuda" and not torch.cuda.is_available():
            raise ValueError("GPU CUDA demandé mais indisponible ; aucun repli silencieux sur CPU")
        torch.set_num_threads(threads)
        self.torch, self.device = torch, device

        def download(repo: dict, name: str) -> Path:
            descriptor = next(f for f in repo["metadata"]["siblings"] if f["rfilename"] == name)
            path = Path(hf_hub_download(repo_id=repo["model_id"], revision=repo["revision"], filename=name))
            verify_download(path, descriptor)
            return path

        weights = download(spec, "model_ema.safetensors")
        vocab = download(spec, "vocab.txt")
        config = download(spec["vocoder"], "config.yaml")
        vocoder_weights = download(spec["vocoder"], "pytorch_model.bin")
        if config.parent != vocoder_weights.parent:
            raise ValueError("Le vocodeur doit être chargé depuis un même snapshot figé")
        self.characters = set(vocab.read_text(encoding="utf-8").splitlines())
        self.check_text(reference_text)
        self.model = load_model(DiT, dict(dim=1024, depth=22, heads=16, ff_mult=2, text_dim=512, conv_layers=4),
                                str(weights), vocab_file=str(vocab), device=device)
        self.vocoder = load_vocoder("vocos", is_local=True, local_path=str(config.parent), device=device)
        # Un texte fourni évite la transcription ASR automatique de F5-TTS.
        self.reference_audio, self.reference_text = preprocess_ref_audio_text(str(reference_audio), reference_text)

    def check_text(self, text: str) -> None:
        latin_prompt(text)
        missing = sorted({c for c in text if not c.isspace() and c not in self.characters})
        if missing:
            raise ValueError(f"Caractères absents du vocabulaire HADRA : {missing}")

    def synthesize(self, text: str, parameters: dict):
        from f5_tts.infer.utils_infer import infer_process

        self.check_text(text)
        self.torch.manual_seed(parameters["seed"])
        with self.torch.inference_mode():
            samples, rate, _ = infer_process(
                self.reference_audio, self.reference_text, text, self.model, self.vocoder,
                nfe_step=parameters["nfe_step"], speed=parameters["speed"],
                cfg_strength=parameters["cfg_strength"], sway_sampling_coef=-1.0,
                device=self.device,
            )
        return samples, rate
