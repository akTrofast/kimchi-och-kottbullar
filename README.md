# Kimchi & Köttbullar – guide

Alexanders utbytesblogg från Seoul, hösten 2026.

**Länken att dela med familj och vänner:**
**https://aktrofast.github.io/kimchi-och-kottbullar/**

**Redigeraren (bara för dig):** https://aktrofast.github.io/kimchi-och-kottbullar/admin/
– ligger också som ikonen **"Skriv inlägg"** på mobilens hemskärm.

Kostnad: 0 kr. Inget behöver uppdateras eller underhållas.

---

## 1. Publicera ett inlägg från mobilen

1. Öppna **Skriv inlägg** på hemskärmen.
2. Tryck **Inlägg** → **New** (Nytt).
3. Fyll i:
   - **Rubrik**
   - **Datum** – fylls i automatiskt (ändra om inlägget handlar om ett annat datum).
   - **Text** – tomrad = nytt stycke. Markera text för fetstil, rubrik eller länk.
   - **Bilder** och **Videor** – se avsnitt 2.
   - **Platser** (valfritt) – se avsnitt 3.
   - **Kommande veckan** (valfritt) – t.ex. "Vandring på Jeju" + ett datum. Visas överst på
     startsidan och försvinner av sig själv efter datumet.
4. Tryck **Save / Publish** uppe till höger och **vänta tills redigeraren säger att det är sparat**
   (lämna inte sidan medan den laddar upp).
5. Efter **ca 3 minuter** syns inlägget på sidan. Efter ytterligare någon minut får
   prenumeranterna ett mejl.

**Tips:** Vill du skriva klart senare – kryssa i **Spara som utkast**. Utkast syns inte på sidan och
inget mejl skickas. Kryssa ur och spara igen när det är klart.

**Ändra eller ta bort ett inlägg:** Öppna det under **Inlägg**, ändra och spara – eller tryck på
menyn (⋮) → **Delete**. Obs: prenumeranterna får bara mejl första gången ett inlägg publiceras,
inte när du rättar det.

## 2. Bilder och videor

- Tryck på **Bilder** och välj så många du vill direkt ur kamerarullen (20+ går bra).
  **Den första bilden blir omslagsbild.** Dra i bilderna för att ändra ordning.
- Bilderna förminskas automatiskt i telefonen innan de laddas upp. Du behöver aldrig tänka på
  storlek. Originalen i kamerarullen påverkas inte.
- **Videor** läggs till i fältet **Videor**. Korta klipp (upp till ~30 sekunder) fungerar bäst.
  De krymps automatiskt efter uppladdningen.
- **Vänta tills alla förhandsbilder syns i formuläret innan du sparar**, särskilt med videor
  (iPhone behöver några sekunder för att förbereda dem).
- Efter publiceringen: öppna inlägget på sidan och kontrollera att bilderna syns. Om något
  saknas får du dessutom ett mejl från GitHub (se avsnitt 6).

## 3. Kartan

- Under **Platser** i ett inlägg: tryck **Add** → skriv ett namn (t.ex. "Busan") → sök eller tryck
  på kartan så att nålen hamnar rätt. "När" (t.ex. "3–20 okt") är valfritt.
- Ett inlägg kan ha flera platser, och platser behöver inte vara där du skrev inlägget.
- **Skriv samma namn när du återvänder till en plats** – då blir det en nål som visar alla inlägg
  därifrån.

## 4. Prenumeranter och mejl

- **Så anmäler sig besökare:** längst ner på varje sida finns rutan *"Få ett mejl vid nya inlägg"*.
  De skriver sin e-post → får ett bekräftelsemejl från Brevo → klickar på länken. Klart.
  (Be dem kolla skräpposten om bekräftelsen inte dyker upp.)
- **Se vem som prenumererar:** logga in på **brevo.com** → **CRM** → **Contacts** → **Lists** →
  **Kimchi & Köttbullar**.
- **Ta bort någon:** i samma lista, markera personen → ta bort från listan.
- **Avsluta:** varje mejl har en länk längst ner där mottagaren själv kan avsluta.
- **Se utskick:** Brevo → **Marketing** → **Campaigns** (visar mottagare, öppningar, klick).
- Gräns i gratisplanen: **300 mejl per dag**, dvs. upp till ca 300 prenumeranter per inlägg.

## 5. Inställningar

I redigeraren → **Inställningar** → **Sidans inställningar** kan du ändra sidans namn, underrubrik,
ankomstdatum, **hemkomstdatum** (då byter dagräknaren till "X dagar i Asien – nu hemma igen") och
texten för dagräknaren (t.ex. "Dag {n} på resande fot" när du lämnar Korea).

## 6. Om något går fel

| Problem | Gör så här |
|---|---|
| Inlägget syns inte efter 5 minuter | Ladda om sidan (dra nedåt). Syns det fortfarande inte: öppna https://github.com/akTrofast/kimchi-och-kottbullar/actions – en gul prick = pågår, vänta. Rött kryss = se sista raden. |
| Bilder saknas i ett inlägg / mejl från GitHub om "Kontrollera att alla bilder kom med" | Uppladdningen tappade filerna. Öppna inlägget i redigeraren, ta bort de trasiga bilderna, lägg till dem igen, spara. Prenumeranterna får mejlet först när bilderna finns. |
| Mejl från GitHub om att *notify* misslyckats | Mejlet till prenumeranterna gick inte iväg. Det görs ett nytt försök automatiskt nästa gång du publicerar. Kolla att Brevo-kontot fungerar (logga in på brevo.com). |
| Redigeraren säger att du inte är inloggad / nyckeln är ogiltig | Nyckeln har gått ut (den gäller ca ett år) eller loggats ut. Gå till https://github.com/settings/personal-access-tokens → **Blogg-redigerare** → **Regenerate token** → kopiera → öppna redigeraren → **Sign In Using Access Token** → klistra in. (Välj *inte* "Sign In with GitHub".) |
| Tappat bort mobilen | Gå till https://github.com/settings/personal-access-tokens och ta bort nyckeln **Blogg-redigerare**, skapa en ny på den nya mobilen. |
| Något annat / rött kryss du inte förstår | Öppna Claude Code i mappen `kimchi-och-kottbullar` och klistra in texten nedan. |

**Text att klistra in i Claude Code:**

> Min blogg Kimchi & Köttbullar (repo akTrofast/kimchi-och-kottbullar, Astro + Sveltia CMS på
> GitHub Pages, mejl via Brevo) har ett problem: [beskriv vad du ser]. Läs CLAUDE.md i projektet,
> titta på senaste körningen under GitHub Actions och hjälp mig laga det steg för steg. Jag är inte
> programmerare.

---

## För den som ska jobba vidare med koden

Se [CLAUDE.md](CLAUDE.md) för teknisk översikt (arkitektur, filer, kommandon och avvägningar).
