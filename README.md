# Portfolio · Mohamed Said Leffat

Portfolio 3D en « scroll story » : la nuit, tu codes à ton bureau ; au scroll, la caméra plonge dans l'écran, ton visage se forme en particules, puis on traverse ton code, l'IA, tes conteneurs et tes projets.

1. **Je construis l'application** : bureau, code, Spring Boot / Angular.
2. **J'y branche l'IA** : documents qui tournent autour d'un noyau RAG.
3. **Je la livre** : les 11 conteneurs Docker de la plateforme Technozor.

Stack : Vite, Three.js, JavaScript, CSS. Bilingue FR / EN (bouton en haut à droite, ou `#en` / `#fr` dans l'URL).

## Lancer en local

```bash
npm install
npm run dev
```

## Ajouter ta photo

Mets ta photo dans `public/images/photo.jpg` (ou `photo.png`). Sans photo, la section « Parcours » affiche tes initiales.

## L'avatar voxel

Le personnage qui t'accompagne pendant le scroll est un avatar voxel en pixel art (`src/world/avatar.js`) : cheveux bouclés, barbe, blazer noir, jean, baskets blanches. Les couleurs sont regroupées dans l'objet `C` en haut du fichier, et chaque face est un petit dessin pixel par pixel.

Il change de pose à chaque chapitre (`CHAPTER_POSE` dans `src/scene.js`) : salut, code sur un laptop, réflexion, pouce levé, montre les projets, mains dans les poches, célébration. Quand tu scrolles vite, il passe en chute libre.

## Captures de tes projets

Les captures sont dans `public/images/projects/` (`legaltech-1..8`, `charikty-1..4`, `eventopia-1..4`). Pour en ajouter, dépose le fichier et ajoute son nom dans l'attribut `data-shots` de la carte du projet dans `index.html`. La vidéo de démo LegalTech est dans `public/media/`.

## Modifier la mise en scène

Les positions de la caméra pour chaque chapitre sont dans `KEYFRAMES` (`src/scene.js`) et la position des décors dans `ZONE_Z` (`src/world/zones.js`). Chaque section HTML avec `data-scene="..."` correspond à une ligne.

## Mettre en ligne (GitHub Pages)

1. Crée un dépôt GitHub (par exemple `saidleffat.github.io` dans une organisation `saidleffat`, pour avoir l'adresse `https://saidleffat.github.io`).
2. Pousse ce dossier sur la branche `main`.
3. Dans le dépôt : **Settings → Pages → Source : GitHub Actions**.
4. Le workflow `.github/workflows/deploy.yml` construit et publie le site à chaque push.
