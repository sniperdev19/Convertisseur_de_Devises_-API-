# 💱 Convertisseur de Devises

Application web de conversion de devises en temps réel, sans backend ni clé API requise.

## 🚀 Fonctionnalités

- **Conversion en temps réel** via l'API [Frankfurter](https://www.frankfurter.app/) (gratuite, open source)
- **35+ devises** supportées dont le **XOF (Franc CFA BCEAO)** via taux fixe EUR
- **Taux direct et inverse** affichés après chaque conversion
- **Bouton swap** pour inverser les devises en un clic
- **Historique** des 10 dernières conversions (persisté dans `localStorage`)
- **Design moderne** sombre avec animations
- **Responsive** — fonctionne sur mobile et desktop
- Conversion déclenchée au clic ou à la touche `Entrée`

## 📁 Structure

```
2_Convertisseur_de_Devises_(API)/
├── index.html   # Structure HTML
├── style.css    # Styles (thème sombre, animations)
├── app.js       # Logique JS + appels API
└── README.md    # Ce fichier
```

## 🌐 API utilisée

**[Frankfurter API](https://www.frankfurter.app/)**
- Gratuite, sans inscription ni clé API
- Données de la Banque Centrale Européenne (BCE)
- Mise à jour chaque jour ouvré (~16h CET)

Endpoints utilisés :
```
GET https://api.frankfurter.app/currencies          → liste des devises
GET https://api.frankfurter.app/latest?amount=1&from=EUR&to=USD  → conversion
```

## 💡 Note sur le XOF

Le Franc CFA (XOF) n'est pas disponible dans l'API Frankfurter car il est géré hors BCE. Il est cependant **arrimé à l'Euro par accord monétaire** à un taux officiel et immuable :

```
1 EUR = 655,957 XOF
```

Les conversions impliquant le XOF utilisent ce taux fixe comme pivot via l'EUR.

## ▶️ Utilisation

Ouvrir directement dans un navigateur ou via un serveur local (WAMP, XAMPP…) :

```
http://Convertisseur_de_Devises_(API)/
```

Aucune dépendance à installer — tout en HTML/CSS/JS vanilla.

## 🛠️ Technologies

| Technologie | Usage |
|---|---|
| HTML5 | Structure |
| CSS3 | Styles, animations (variables CSS, flexbox) |
| JavaScript ES6+ | Logique, `fetch`, `async/await` |
| Frankfurter API | Taux de change en temps réel |
| localStorage | Persistance de l'historique |
