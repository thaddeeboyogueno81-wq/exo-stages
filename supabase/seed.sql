-- =============================================================
-- Lify — Données de démarrage (contenus libres de droits)
-- À exécuter APRÈS schema.sql. Les médias d'exemple utilisent des
-- sources du domaine public (LibriVox, archive.org, Project Gutenberg).
-- Pour un vrai catalogue, téléversez les fichiers dans Supabase Storage
-- (bucket "media") et mettez à jour media_url / book_url / cover_url.
-- =============================================================

-- Catalogue musique (LibriVox — domaine public)
insert into media_contents (title, creator_credit, category, description, license, media_kind, media_url, cover_url, duration_seconds)
values
  ('Carnaval des animaux — Le Cygne', 'Camille Saint-Saëns (LibriVox)', 'music', 'Piano classique du domaine public, lu et interprété par des bénévoles LibriVox.', 'Domaine public', 'audio', 'https://archive.org/download/carnaval_des_animaux_librivox/carnaval_cygne.mp3', null, 180),
  ('Clair de lune (lecture)', 'Guy de Maupassant (LibriVox)', 'music', 'Nouvelle lue à voix haute, enregistrement du domaine public.', 'Domaine public', 'audio', 'https://archive.org/download/clair_de_lune_librivox/clair_de_lune.mp3', null, 1500);

-- Catalogue vidéo (archive.org — domaine public)
insert into media_contents (title, creator_credit, category, description, license, media_kind, media_url, cover_url, duration_seconds)
values
  ('Big Buck Bunny', 'Blender Foundation', 'video', 'Court-métrage d''animation libre (licence Creative Commons Attribution 3.0).', 'Creative Commons', 'video', 'https://archive.org/download/BigBuckBunny_124/Content/big.mp4', null, 600);

-- Bibliothèque (Project Gutenberg — domaine public)
insert into media_contents (title, creator_credit, category, description, license, media_kind, media_url, book_url)
values
  ('Le Petit Prince', 'Antoine de Saint-Exupéry', 'book', 'Texte intégral tel que diffusé sur les plateformes du domaine public.', 'Domaine public', 'audio', 'about:blank', 'https://www.gutenberg.org/files/5000-8/5000-8.txt'),
  ('Candide', 'Voltaire', 'book', 'Conte philosophique de 1759, texte intégral.', 'Domaine public', 'audio', 'about:blank', 'https://www.gutenberg.org/cache/epub/19942/pg19942.txt'),
  ('Notre-Dame de Paris', 'Victor Hugo', 'book', 'Roman de 1831, texte intégral.', 'Domaine public', 'audio', 'about:blank', 'https://www.gutenberg.org/cache/epub/2610/pg2610.txt');
