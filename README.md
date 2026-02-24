# Dind'Or - Application Administrative Backend

Application backend Spring Boot pour la gestion administrative de la société Dind'Or.

## 🚀 Technologies

- **Spring Boot 3.5.11** - Framework principal
- **Spring Security** - Authentification et autorisation
- **JWT (JSON Web Tokens)** - Authentification stateless
- **MySQL** - Base de données
- **Spring Data JPA / Hibernate** - ORM
- **Spring Mail** - Envoi d'emails
- **Lombok** - Réduction du code boilerplate
- **Maven** - Gestion des dépendances

## 📋 Prérequis

- Java 17 ou supérieur
- MySQL 8.0 ou supérieur
- Maven 3.6+

## 🔧 Configuration

### 1. Base de données

Créez une base de données MySQL :

```sql
CREATE DATABASE dindorpfe CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Variables d'environnement

Le fichier `application.properties` utilise des variables d'environnement avec des valeurs par défaut. Pour la production, configurez ces variables :

**Base de données :**
- `DB_URL` - URL de connexion MySQL
- `DB_USERNAME` - Nom d'utilisateur MySQL
- `DB_PASSWORD` - Mot de passe MySQL

**Admin :**
- `ADMIN_EMAIL` - Email du compte administrateur
- `ADMIN_PASSWORD` - Mot de passe initial (sera hashé avec BCrypt)
- `ADMIN_FIRST_NAME` - Prénom de l'administrateur
- `ADMIN_LAST_NAME` - Nom de l'administrateur

**JWT :**
- `JWT_SECRET` - Clé secrète pour signer les tokens (minimum 64 caractères)
- `JWT_EXPIRATION` - Durée de validité du token en millisecondes (défaut: 24h)
- `JWT_REFRESH_EXPIRATION` - Durée de validité du refresh token (défaut: 7 jours)

**Email :**
- `MAIL_HOST` - Serveur SMTP
- `MAIL_PORT` - Port SMTP
- `MAIL_USERNAME` - Email d'envoi
- `MAIL_PASSWORD` - Mot de passe de l'email
- `MAIL_FROM` - Adresse email d'expéditeur
- `MAIL_FROM_NAME` - Nom de l'expéditeur

**Sécurité :**
- `MAX_LOGIN_ATTEMPTS` - Nombre maximum de tentatives de connexion (défaut: 5)
- `LOCKOUT_DURATION` - Durée de verrouillage en millisecondes (défaut: 15 minutes)
- `CORS_ALLOWED_ORIGINS` - Origines autorisées pour CORS

### 3. Configuration Gmail (si utilisation de Gmail SMTP)

Pour utiliser Gmail, vous devez :
1. Activer l'authentification à deux facteurs
2. Générer un "Mot de passe d'application" dans les paramètres Google
3. Utiliser ce mot de passe dans `MAIL_PASSWORD`

## 🏃 Exécution

### Développement

```bash
mvn spring-boot:run
```

### Production

```bash
mvn clean package
java -jar target/dindor-0.0.1-SNAPSHOT.jar
```

L'application démarre sur le port **8099** avec le contexte `/api`.

## 📡 API Endpoints

### Authentification

- `POST /api/auth/login` - Connexion
  ```json
  {
    "email": "dindormarouane@gmail.com",
    "password": "password",
    "rememberMe": false
  }
  ```

- `POST /api/auth/refresh` - Rafraîchir le token
  ```json
  {
    "refreshToken": "token"
  }
  ```

- `POST /api/auth/logout` - Déconnexion (côté client)

### Réinitialisation de mot de passe

- `POST /api/password-reset/request` - Demander une réinitialisation
  ```json
  {
    "email": "dindormarouane@gmail.com"
  }
  ```
  **Note :** Seul l'email officiel de Dind'Or peut demander une réinitialisation.

- `POST /api/password-reset/confirm` - Confirmer la réinitialisation
  ```json
  {
    "token": "reset-token",
    "newPassword": "NewPassword123!",
    "confirmPassword": "NewPassword123!"
  }
  ```

### Admin

- `GET /api/admin/me` - Informations de l'admin connecté
  - Requiert : Header `Authorization: Bearer <token>`

## 🔒 Sécurité

### Authentification JWT

- Les tokens JWT sont utilisés pour l'authentification stateless
- Le token d'accès expire après 24h (configurable)
- Le refresh token expire après 7 jours (configurable)
- Les tokens sont signés avec HMAC SHA-256

### Protection contre les attaques

- **Brute Force :** Verrouillage du compte après 5 tentatives échouées (configurable)
- **Durée de verrouillage :** 15 minutes (configurable)
- **Audit :** Toutes les tentatives de connexion sont enregistrées avec IP et User-Agent
- **Réinitialisation sécurisée :** 
  - Seul l'email officiel peut demander une réinitialisation
  - Token sécurisé avec expiration (1h)
  - Maximum 3 tentatives par token
  - Validation de la complexité du mot de passe

### Règles de mot de passe

- Minimum 8 caractères
- Au moins une majuscule
- Au moins une minuscule
- Au moins un chiffre
- Au moins un caractère spécial (@$!%*?&)

## 📊 Base de données

### Tables créées automatiquement

- `admins` - Compte administrateur unique
- `password_reset_tokens` - Tokens de réinitialisation
- `login_attempts` - Historique des tentatives de connexion

### Initialisation

Le compte administrateur est créé automatiquement au premier démarrage avec les informations configurées dans `application.properties`.

## 📝 Logging

Les logs sont enregistrés dans `logs/dindor-application.log` avec :
- Tentatives de connexion (succès/échec)
- Erreurs de sécurité
- Opérations administratives
- Erreurs applicatives

## 🧹 Tâches planifiées

- **Nettoyage des tokens expirés :** Tous les jours à 2h du matin

## 🛠️ Structure du projet

```
src/main/java/com/poly/dindor/
├── config/          # Configurations (Security, Email, etc.)
├── controller/       # Controllers REST
├── dto/             # Data Transfer Objects
├── entity/          # Entités JPA
├── exception/        # Gestion des erreurs
├── repository/      # Repositories JPA
├── security/         # Configuration Spring Security
├── service/          # Services métier
└── util/            # Utilitaires (JWT, etc.)
```

## 📧 Support

Pour toute question ou problème, contactez l'équipe de développement Dind'Or.
