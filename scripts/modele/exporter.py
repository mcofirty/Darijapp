"""
Prépare le modèle de reconnaissance des sons pour l'appli (score précis, expérimental).

Le modèle est Allosaurus (CMU, licence GPL-3.0) : un petit réseau BLSTM qui reconnaît les sons
(alphabet phonétique international) de plus de 2 000 langues, dont l'arabe (ʕ ħ q x ɣ).
Ce script, lancé par l'Action « Modèle » (internet ouvert, contrairement à l'environnement de Claude Code) :

1. télécharge le modèle uni2005 depuis GitHub ;
2. l'exporte en ONNX (lisible par onnxruntime-web dans Safari) et vérifie qu'il donne les mêmes sorties ;
3. affiche ce qu'il reconnaît sur les MP3 des paires de sons (9elb / kelb, 7al / hal…), pour juger s'il distingue nos sons ;
4. écrit dans public/modele/ le modèle, la liste des sons, l'inventaire arabe et les réglages des MFCC,
   et dans src/scoring/sons/reference.json un exemple (échantillons, MFCC, sorties) pour tester le code TypeScript.
"""

import base64
import json
import subprocess
import sys
import time
import wave
from argparse import Namespace
from pathlib import Path

import numpy as np
import onnxruntime as ort
import torch

from allosaurus.app import Recognizer
from allosaurus.am.factory import read_am
from allosaurus.audio import read_audio
from allosaurus.bin.download_model import download_model
from allosaurus.lm.factory import read_lm
from allosaurus.pm.factory import read_pm

RACINE = Path(__file__).resolve().parents[2]
SORTIE = RACINE / 'public' / 'modele'
TEMP = Path('/tmp/allosaurus')
NOM = 'uni2005'


def wav16k(mp3: Path) -> Path:
    """Décode un MP3 en WAV 16 kHz mono 16 bits (format lu par Allosaurus)."""
    sortie = TEMP / (mp3.stem + '.wav')
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', str(mp3), '-ac', '1', '-ar', '16000', '-sample_fmt', 's16', str(sortie)], check=True)
    return sortie


class Enveloppe(torch.nn.Module):
    """Le réseau seul, sans les séquences empaquetées de PyTorch (une seule phrase à la fois) : MFCC (1, T, F) → logits (1, T, P)."""

    def __init__(self, modele):
        super().__init__()
        self.modele = modele

    def forward(self, mfcc):
        sortie, _ = self.modele.blstm_layer(mfcc.transpose(0, 1))
        return self.modele.phone_layer(sortie).transpose(0, 1)


def main():
    TEMP.mkdir(parents=True, exist_ok=True)
    SORTIE.mkdir(parents=True, exist_ok=True)
    download_model(NOM, TEMP)
    chemin = TEMP / NOM
    for f in sorted(chemin.rglob('*')):
        if f.is_file() and 'inventory' not in f.parts:
            print(f'{f.relative_to(chemin)} : {f.stat().st_size / 1e6:.2f} Mo')

    pm_config = json.load(open(chemin / 'pm_config.json'))
    am_config = json.load(open(chemin / 'am_config.json'))
    print('pm_config', json.dumps(pm_config))
    print('am_config', json.dumps({k: (v if not isinstance(v, dict) else f'<{len(v)} entrées>') for k, v in am_config.items()}))

    config = Namespace(model=NOM, device_id=-1, lang='ipa', approximate=False, prior=None)
    pm = read_pm(chemin, config)
    am = read_am(chemin, config)
    lm = read_lm(chemin, config)
    am.eval()
    reco = Recognizer(pm, am, lm, config)
    for langue in ['ara', 'arb', 'ary', 'arq', 'acm']:
        print('inventaire', langue, reco.is_available(langue))

    unites = lm.inventory.unit
    sons = [unites.get_unit(i) for i in range(len(unites))]
    print('sons universels :', len(sons))
    ara = lm.inventory.get_unit('ara')
    sons_ara = [ara.get_unit(i) for i in range(1, len(ara))]
    print('inventaire arabe :', ' '.join(sons_ara))
    for s in ['ʕ', 'ħ', 'q', 'x', 'χ', 'ɣ', 'ʁ', 'h', 'k', 'ɡ', 'ʔ', 'ʃ', 'ʒ', 'r', 'ɾ', 'sˤ', 'tˤ', 'dˤ', 'ə']:
        print(f'  {s} universel : {s in sons}, arabe : {s in sons_ara}')

    # Export ONNX et vérification sur un vrai mot.
    enveloppe = Enveloppe(am).eval()
    wav = wav16k(RACINE / 'public' / 'audio' / 'son-9elb.mp3')
    mfcc = pm.compute(read_audio(str(wav)))
    entree = torch.from_numpy(np.expand_dims(mfcc, 0).astype(np.float32))
    with torch.no_grad():
        attendu = enveloppe(entree).numpy()
        complet = am(entree, None).detach().numpy()
    print('écart enveloppe / modèle complet :', float(np.abs(attendu - complet).max()))
    onnx = TEMP / 'allosaurus.onnx'
    torch.onnx.export(enveloppe, entree, str(onnx), input_names=['mfcc'], output_names=['logits'],
                      dynamic_axes={'mfcc': {1: 'T'}, 'logits': {1: 'T'}}, opset_version=17)
    session = ort.InferenceSession(str(onnx), providers=['CPUExecutionProvider'])
    debut = time.time()
    obtenu = session.run(None, {'mfcc': entree.numpy()})[0]
    print(f'écart ONNX / PyTorch : {float(np.abs(attendu - obtenu).max()):.2e} ({(time.time() - debut) * 1000:.0f} ms pour {mfcc.shape[0]} trames)')
    print(f'taille ONNX : {onnx.stat().st_size / 1e6:.1f} Mo')

    # Ce que le modèle entend sur les paires de sons (voix Jamal).
    paires = json.load(open(RACINE / 'src' / 'data' / 'sons' / 'paires.json'))
    for p in paires['paires']:
        for cote in (p['a'], p['b']):
            mp3 = RACINE / 'public' / 'audio' / f'{cote}.mp3'
            if not mp3.exists():
                continue
            w = str(wav16k(mp3))
            print(f'{cote:14} ara : {reco.recognize(w, "ara"):24} | ipa : {reco.recognize(w, "ipa"):24} | top3 : {reco.recognize(w, "ara", topk=3)}')

    # Fichiers de l'appli.
    (SORTIE / 'allosaurus.onnx').write_bytes(onnx.read_bytes())
    json.dump({'sons': sons, 'arabe': sons_ara, 'mfcc': pm_config}, open(SORTIE / 'sons.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    with wave.open(str(wav)) as f:
        echantillons = f.readframes(f.getnframes())
    reference = {
        'mot': 'son-9elb',
        'echantillons': base64.b64encode(echantillons).decode(),
        'mfcc': np.round(mfcc, 5).tolist(),
        'logits': np.round(attendu[0], 4).tolist(),
    }
    cible = RACINE / 'src' / 'scoring' / 'sons'
    cible.mkdir(parents=True, exist_ok=True)
    json.dump(reference, open(cible / 'reference.json', 'w'))
    print('fichiers écrits')


if __name__ == '__main__':
    sys.exit(main())
