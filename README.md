# IWAProject-Front

## 📱 Frontend Mobile - Application de Garde d'Animaux

**Partie Front du Projet IWA de la spécialisation DAMS5 à Polytech Montpellier**

---

## 🎯 Description du Projet

IWAProject-Front est une application mobile React Native développée dans le cadre du projet IWA (Innovation Web Application) de la spécialisation DAMS5 (Développement d'Applications Mobiles et Systèmes) à Polytech Montpellier.

Cette application permet aux utilisateurs de :
- 🔍 Rechercher des services de garde d'animaux
- 💖 Ajouter des annonces en favoris
- 📝 Créer et gérer leurs propres annonces
- 💬 Communiquer avec les propriétaires
- 👤 Gérer leur profil et leurs abonnements

---

## 🛠️ Technologies Utilisées

- **React Native** - Framework de développement mobile
- **Expo** - Plateforme de développement et déploiement
- **TypeScript** - Langage de programmation typé
- **React Navigation** - Navigation entre les écrans
- **Expo Vector Icons** - Bibliothèque d'icônes
- **React Native Paper** - Composants UI Material Design

---

## 🚀 Installation et Lancement

### Prérequis
- Node.js (version 18 ou supérieure)
- npm ou yarn
- Expo CLI
- Un émulateur mobile ou un appareil physique

### Installation
```bash
# Cloner le repository
git clone <repository-url>
cd IWAProject-Front

# Installer les dépendances
npm install
```

### Configuration pour les tests locaux

Si vous testez l'application sur votre ordinateur local, vous devez configurer l'adresse IP de votre machine dans le fichier `.env`.

#### Récupérer l'adresse IP de votre ordinateur

**Windows :**
```bash
# Ouvrir PowerShell ou Invite de commandes
ipconfig

# Chercher la section "Carte réseau Ethernet" ou "Carte réseau sans fil"
# L'adresse IPv4 ressemble à : 192.168.x.x ou 10.0.x.x
```

**Linux :**
```bash
# Méthode 1 : Utiliser ip
ip addr show

# Méthode 2 : Utiliser ifconfig
ifconfig

# Méthode 3 : Utiliser hostname
hostname -I

# Chercher l'adresse IP de votre interface réseau (eth0, wlan0, etc.)
# L'adresse IP ressemble à : 192.168.x.x ou 10.0.x.x
```

**macOS :**
```bash
# Méthode 1 : Utiliser ifconfig
ifconfig | grep "inet "

# Méthode 2 : Utiliser networksetup
networksetup -getinfo "Wi-Fi"
# ou
networksetup -getinfo "Ethernet"

# Chercher l'adresse IP (généralement sous "IP address")
# L'adresse IP ressemble à : 192.168.x.x ou 10.0.x.x
```

#### Configurer le fichier .env

1. Créer un fichier `.env` à la racine du projet (copier depuis `.env.example` si disponible)
2. Remplacer `your_api_url` par l'adresse IP de votre ordinateur avec le port de l'API backend

Exemple :
```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
EXPO_PUBLIC_APP_NAME=IWAProject
```

> **Note :** Assurez-vous que votre backend est bien démarré et accessible sur cette adresse IP. Si vous utilisez un port différent, ajustez l'URL en conséquence.

```bash
# Lancer l'application
npm start
```

### Commandes disponibles
```bash
npm start          # Démarrer le serveur de développement
npm run android    # Lancer sur Android
npm run ios        # Lancer sur iOS
npm run web        # Lancer sur le web
```

---

## 📱 Fonctionnalités Principales

### 🏠 Page d'Accueil
- Recherche d'annonces avec filtres
- Affichage des annonces populaires
- Navigation vers les détails

### ❤️ Favoris
- Liste des annonces favorites
- Gestion des favoris

### ➕ Création d'Annonce
- Formulaire de création d'annonce
- Upload de photos
- Configuration des préférences

### 💬 Messages
- Interface de messagerie
- Conversations avec les propriétaires
- Recherche de conversations

### 👤 Profil
- Gestion du profil utilisateur
- Historique des gardes
- Avis et évaluations
- Abonnements et paiements

---

## 🧪 Tests

```bash
# Lancer les tests
npm test

# Tests avec couverture
npm run test:coverage
```

---

## 📦 Déploiement

### Build de production
```bash
# Build pour Android
expo build:android

# Build pour iOS
expo build:ios
```

### Publication sur les stores
```bash
# Publier sur Google Play
expo upload:android

# Publier sur App Store
expo upload:ios
```

---

## 👥 Équipe de Développement

**Spécialisation DAMS5 - Polytech Montpellier**
- Développement dans le cadre du projet IWA
- Encadrement par l'équipe pédagogique de Polytech Montpellier

---

## 📄 Licence

Ce projet est développé dans le cadre académique de la spécialisation DAMS5 à Polytech Montpellier.

---

## 🤝 Contribution

Pour contribuer au projet :
1. Fork le repository
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit vos changements (`git commit -am 'Ajout d'une nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request

---

## 📞 Support

Pour toute question ou problème :
- Créer une issue sur GitHub
- Contacter l'équipe de développement
- Consulter la documentation Expo

---

**Développé avec ❤️ par l'équipe DAMS5 de Polytech Montpellier**