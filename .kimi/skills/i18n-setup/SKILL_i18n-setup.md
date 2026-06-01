---
name: i18n-setup
description: react-i18next configuration with lazy loading, language detection, and ES/EN/FR support
---

## i18n Setup Rules

### Configuration
- Library: `react-i18next` + `i18next-browser-languagedetector` + `i18next-http-backend`
- Fallback: `es`
- Supported: `es`, `en`, `fr`
- Detection order: `localStorage` → `cookie` → `navigator` → `querystring`
- Lazy loading via HTTP backend

### File Structure
```
public/
└── locales/
    ├── en/
    │   └── common.json
    ├── es/
    │   └── common.json
    └── fr/
    │   └── common.json
```

### JSON Structure
```json
{
  "welcome": "Bienvenido",
  "login": {
    "title": "Iniciar sesión",
    "button": "Entrar"
  },
  "errors": {
    "required": "Campo obligatorio"
  }
}
```

### Usage in Components
```tsx
import { useTranslation } from 'react-i18next';

const Component = () => {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <h1>{t('welcome')}</h1>
      <p>{t('login.title')}</p>
      <button onClick={() => i18n.changeLanguage('en')}>
        Switch to English
      </button>
    </div>
  );
};
```

### Interpolation
```tsx
t('greeting', { name: 'Juan' });        // "Hola, Juan!"
t('items', { count: 5 });               // "5 artículos" (uses plural)
```

### Pluralization
```json
{
  "items": "{{count}} artículo",
  "items_plural": "{{count}} artículos"
}
```

### Language Switcher
- Component: `src/i18n/LanguageSwitcher.tsx`
- Shows active language
- Buttons for each supported language
- Updates `i18n.language` and persists to localStorage

### Rules
- **ALL user-facing strings** must use `t('key')`
- **NEVER** hardcode text in components
- **NEVER** hardcode text in JSX
- Add new languages only after explicit approval
