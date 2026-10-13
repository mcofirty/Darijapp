"""
Évalue et prépare le grand modèle de reconnaissance des sons : wav2vec2 XLSR-53 affiné sur la phonétique
de Common Voice (facebook/wav2vec2-xlsr-53-espeak-cv-ft, Meta, licence Apache 2.0). Il connaît ʕ ħ q x ɣ.

Lancé par l'Action « Modèle » (Hugging Face est bloqué dans l'environnement de Claude Code) :
1. télécharge le modèle, l'exporte en ONNX, le compresse en int8 et vérifie les sorties ;
2. affiche ce qu'il entend sur les MP3 des paires de sons (voix Jamal), la taille et le temps de calcul ;
3. si ENREGISTRER=1, écrit dans public/modele/ le modèle découpé en morceaux de 45 Mo (limite de GitHub),
   son vocabulaire et ses réglages, et dans src/scoring/sons/reference-xlsr.json un exemple pour les tests.
"""

import base64
import json
import os
import subprocess
import sys
import time
from pathlib import Path

import numpy as np
import onnxruntime as ort
import torch
from onnxruntime.quantization import QuantType, quantize_dynamic
from transformers import Wav2Vec2FeatureExtractor, Wav2Vec2ForCTC

RACINE = Path(__file__).resolve().parents[2]
SORTIE = RACINE / 'public' / 'modele'
TEMP = Path('/tmp/xlsr')
NOM = 'facebook/wav2vec2-xlsr-53-espeak-cv-ft'
MORCEAU = 45 * 1024 * 1024


def echantillons(mp3: Path) -> np.ndarray:
    """MP3 décodé en 16 kHz mono, nombres flottants entre -1 et 1."""
    brut = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', str(mp3), '-ac', '1', '-ar', '16000', '-f', 's16le', '-'],
                          check=True, capture_output=True).stdout
    return np.frombuffer(brut, dtype=np.int16).astype(np.float32) / 32768


def normaliser(x: np.ndarray, extracteur) -> np.ndarray:
    return extracteur(x, sampling_rate=16000, return_tensors='np').input_values.astype(np.float32)


def lire(logits: np.ndarray, vocab: list[str], top=3) -> tuple[str, str]:
    """Décodage glouton (CTC) et les 3 sons les plus probables à chaque son émis."""
    probas = np.exp(logits - logits.max(-1, keepdims=True))
    probas /= probas.sum(-1, keepdims=True)
    ids = logits.argmax(-1)
    sons, details, avant = [], [], -1
    for t, i in enumerate(ids):
        if i != avant and i != 0:
            sons.append(vocab[i])
            meilleurs = probas[t].argsort()[::-1][:top]
            details.append(' '.join(f'{vocab[j]}({probas[t, j]:.2f})' for j in meilleurs))
        avant = i
    return ' '.join(sons), ' | '.join(details)


def main():
    TEMP.mkdir(parents=True, exist_ok=True)
    extracteur = Wav2Vec2FeatureExtractor.from_pretrained(NOM)
    modele = Wav2Vec2ForCTC.from_pretrained(NOM).eval()
    print('réglages de l’extracteur :', extracteur.to_dict())
    from huggingface_hub import hf_hub_download
    vocab_dict = json.load(open(hf_hub_download(NOM, 'vocab.json')))
    vocab = [''] * len(vocab_dict)
    for son, i in vocab_dict.items():
        vocab[i] = son
    print('blanc (indice 0) :', vocab[0], '| taille du vocabulaire :', len(vocab), '| paramètres :', sum(p.numel() for p in modele.parameters()))
    for s in ['ʕ', 'ħ', 'q', 'x', 'χ', 'ɣ', 'ʁ', 'h', 'k', 'ɡ', 'ʔ', 'ʃ', 'ʒ', 'r', 'ɾ', 'sˤ', 'tˤ', 'dˤ', 'ə', 'a', 'aː', 'i', 'u']:
        print(f'  {s} dans le vocabulaire : {s in vocab_dict}')
    print('vocabulaire :', ' '.join(vocab))

    # Export ONNX (16 kHz normalisé → logits), puis compression int8 des multiplications de matrices.
    exemple = normaliser(echantillons(RACINE / 'public' / 'audio' / 'son-9elb.mp3'), extracteur)
    entree = torch.from_numpy(exemple)
    with torch.no_grad():
        attendu = modele(entree).logits.numpy()
    brut = TEMP / 'xlsr.onnx'
    torch.onnx.export(modele, entree, str(brut), input_names=['audio'], output_names=['logits'],
                      dynamic_axes={'audio': {1: 'N'}, 'logits': {1: 'T'}}, opset_version=17)
    compresse = TEMP / 'xlsr-int8.onnx'
    quantize_dynamic(str(brut), str(compresse), weight_type=QuantType.QInt8, op_types_to_quantize=['MatMul'])
    print(f'taille ONNX : {brut.stat().st_size / 1e6:.0f} Mo, compressé : {compresse.stat().st_size / 1e6:.0f} Mo')

    options = ort.SessionOptions()
    options.intra_op_num_threads = 1
    sessions = {nom: ort.InferenceSession(str(f), options, providers=['CPUExecutionProvider']) for nom, f in [('fp32', brut), ('int8', compresse)]}
    for nom, s in sessions.items():
        debut = time.time()
        obtenu = s.run(None, {'audio': exemple})[0]
        duree = time.time() - debut
        print(f'{nom} : écart avec PyTorch {float(np.abs(attendu - obtenu).max()):.3f}, '
              f'même lecture : {lire(obtenu[0], vocab)[0] == lire(attendu[0], vocab)[0]}, '
              f'{duree * 1000:.0f} ms pour {exemple.shape[1] / 16000:.2f} s d’audio (1 cœur)')

    # Ce que le modèle compressé entend sur les paires de sons.
    paires = json.load(open(RACINE / 'src' / 'data' / 'sons' / 'paires.json'))
    for p in paires['paires']:
        for cote in (p['a'], p['b']):
            mp3 = RACINE / 'public' / 'audio' / f'{cote}.mp3'
            if mp3.exists():
                logits = sessions['int8'].run(None, {'audio': normaliser(echantillons(mp3), extracteur)})[0][0]
                lu, details = lire(logits, vocab)
                print(f'{cote:12} {lu:22} | {details}')
    # Quelques mots et une phrase du programme.
    for nom in ['salutations-012', 'salutations-012-ex']:
        mp3 = RACINE / 'public' / 'audio' / f'{nom}.mp3'
        if mp3.exists():
            print(f'{nom:20} {lire(sessions["int8"].run(None, {"audio": normaliser(echantillons(mp3), extracteur)})[0][0], vocab)[0]}')

    if os.environ.get('ENREGISTRER') != '1':
        print('évaluation seule (ENREGISTRER=1 pour écrire le modèle dans le repo)')
        return
    SORTIE.mkdir(parents=True, exist_ok=True)
    for ancien in SORTIE.glob('xlsr-int8.onnx.*'):
        ancien.unlink()
    donnees = compresse.read_bytes()
    morceaux = []
    for k in range(0, len(donnees), MORCEAU):
        nom = f'xlsr-int8.onnx.{k // MORCEAU}'
        (SORTIE / nom).write_bytes(donnees[k:k + MORCEAU])
        morceaux.append(nom)
    json.dump({'modele': NOM, 'morceaux': morceaux, 'taille': len(donnees), 'vocabulaire': vocab,
               'normaliser': bool(extracteur.do_normalize)},
              open(SORTIE / 'xlsr.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    reference = {
        'mot': 'son-9elb',
        'echantillons': base64.b64encode(echantillons(RACINE / 'public' / 'audio' / 'son-9elb.mp3').tobytes()).decode(),
        'logits': np.round(sessions['int8'].run(None, {'audio': exemple})[0][0], 3).tolist(),
    }
    (RACINE / 'src' / 'scoring' / 'sons').mkdir(parents=True, exist_ok=True)
    json.dump(reference, open(RACINE / 'src' / 'scoring' / 'sons' / 'reference-xlsr.json', 'w'))
    print('fichiers écrits :', ', '.join(morceaux))


if __name__ == '__main__':
    sys.exit(main())
