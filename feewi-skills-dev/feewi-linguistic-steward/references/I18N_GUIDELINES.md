# Directives i18n Feewi

## 1. Nomenclature des Clés
Structure : `[domaine].[catégorie].[clé]`

Exemples :
- `enrollment.form.first_name`
- `admin.actions.validate_dossier`
- `global.errors.required_field`

## 2. Best Practices
- Toujours utiliser des clés descriptives en anglais.
- Éviter les clés trop génériques comme `button.ok` (préférez `global.actions.confirm`).
- Utiliser des paramètres pour les valeurs dynamiques : `{{ count }} dossiers sélectionnés`.
