# Matrice de Notification Feewi

Impératif : Ne pas spammer l'utilisateur. Choisir le bon canal selon la gravité.

| Type | Canal | Persistance | Usage Type |
|---|---|---|---|
| **Non-bloquant** | **Toast (Snackbar)** | Éphémère (5s) | Succès d'action, info mineure. Jamais pour erreur critique. |
| **Contextuel** | **Banner (Inline)** | Persistant | Erreur de formulaire, avertissement de configuration. |
| **Critique** | **Modale** | Bloquant | Action irréversible, destruction de données, erreur serveur majeure. |

## Règle d'Or
Ne jamais utiliser de boutons "Oui/Non" côte à côte avec le même poids visuel. L'action destructive ou principale doit être visuellement distincte.
