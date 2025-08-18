# FinanceSkills Hub

FinanceSkills Hub è un'app web portfolio personale dedicata a mostrare le mie competenze tecniche e il mio interesse per la finanza e i mercati.  
L'app integra autenticazione sicura, gestione di portafogli virtuali, analisi dati finanziari e visualizzazioni interattive, offrendo anche contenuti di approfondimento.

---

## Struttura del progetto

├── README.md
├── backend
│   ├── Dockerfile
│   ├── node_modules
│   ├── package-lock.json
│   ├── package.json
│   └── prisma
├── docs
├── frontend
│   ├── Dockerfile
│   ├── README.md
│   ├── eslint.config.mjs
│   ├── next-env.d.ts
│   ├── next.config.ts
│   ├── node_modules
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.mjs
│   ├── public
│   ├── src
│   └── tsconfig.json
├── infrastructure
│   ├── docs
│   ├── environments
│   ├── modules
│   └── scripts
├── k8s-manifests
│   ├── backend-deployment.yaml
│   ├── backend-pvc.yaml
│   ├── backend-service.yaml
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   ├── namespace.yaml
│   ├── nginx-deployment.yaml
│   ├── nginx-service.yaml
│   ├── pgadmin-deployment.yaml
│   ├── pgadmin-service.yaml
│   ├── postgres-deployment.yaml
│   ├── postgres-init-sql-configmap.yaml
│   ├── postgres-service.yaml
│   ├── redis-configmap.yaml
│   ├── redis-deployment.yaml
│   └── redis-service.yaml
└── scripts
    ├── apply-k8s.sh
    ├── build-images.sh
    └── deploy.log

---

## Funzionalità principali

- Registrazione e login con JWT
- Dashboard con dati di mercato in tempo reale (azioni, crypto)
- Gestione portafogli virtuali (acquisti/vendite con fondi simulati)
- Analisi finanziaria (indicatori tecnici, report, esportazioni CSV)
- Blog personale con articoli su finanza e tecnologia
- Funzionalità di gamification (quiz, badge, leaderboard)
- Deploy containerizzato con Docker e Kubernetes

## Come iniziare

### Prerequisiti

- Docker e Docker Hub account
- Node.js (per sviluppo locale backend/frontend)
- Kubernetes cluster (minikube o cloud provider)
- Kubectl CLI configurato

### Build e push delle immagini Docker

- salvare chiave docker con env variable 

- creare certificato locale 
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout tls.key -out tls.crt \
  -subj "/CN=localhost/O=local"


Dalla root del progetto:

```bash

./scripts/build-images.sh

./scripts/apply-k8s.sh




 kubectl port-forward -n financeplatform svc/backend 4000:3001 & (to reach backend) http://localhost:4000/api-docs/
 kubectl port-forward -n financeplatform svc/pgadmin 8081:80 (to reach pgadmin) http://localhost:8081/browser/
 http://localhost:4000/api-docs/  
 http://localhost:8080/
