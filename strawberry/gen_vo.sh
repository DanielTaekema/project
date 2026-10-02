#!/bin/bash
# Lokale NL-stem (espeak-ng + mbrola) als stand-in voor ElevenLabs. Per scene een wav.
cd "$(dirname "$0")/public/audio"
S=${1:-185}
declare -a T
T[1]="Een AI die een examen haalt, maar niet kan tellen hoeveel R's er in strawberry zitten. Hoe kan dat?"
T[2]="Het antwoord is drie. Dat zie jij in één seconde. Maar het model ziet dit woord helemaal niet zoals jij."
T[3]="Een taalmodel leest geen letters. Voordat het je tekst ziet, wordt die in stukjes gehakt, tokens. Strawberry wordt bijvoorbeeld str, aw en berry. En elk stukje wordt een getal."
T[4]="Het is alsof ik jou vraag hoeveel R's er in dit plaatje zitten. Je ziet geen letters, je ziet één ding. Zo ziet het model het hele woord."
T[5]="Hoe krijgt hij het dan soms toch goed? Omdat hij het woord kan uitschrijven, letter voor letter, en dan wel kan tellen."
T[6]="Dus dit is geen domheid. Het model kijkt gewoon door een bril waar letters niet in passen."
for i in 1 2 3 4 5 6; do
  espeak-ng -v mb-nl2 -s $S -p 45 -w raw$i.wav "${T[$i]}"
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 raw$i.wav)
  echo "scene $i: $d s"
done
