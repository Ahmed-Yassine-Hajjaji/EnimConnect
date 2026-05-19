# N8n Workflows – EnimConnect

## Workflows

### 1. `workflow_chef_notification.json`
Triggered when a company submits an offer. Sends one email per (department × chef) pair with **Valider** and **Refuser** buttons linking directly to the FastAPI validation endpoints.

**Webhook path:** `POST /webhook/chef-validation`
**Backend env var:** `N8N_WEBHOOK_URL=http://<n8n-host>:5678/webhook/chef-validation`

### 2. `workflow_company_decision.json`
Triggered when a chef validates or rejects an offer for a department. Sends an email to the company with the decision, the rejection motif (if any), and a summary of all department statuses.

**Webhook path:** `POST /webhook/company-decision`
**Backend env var:** `N8N_COMPANY_WEBHOOK_URL=http://<n8n-host>:5678/webhook/company-decision`

## Import steps

1. Open N8n → **Workflows** → **Import from file**
2. Import each JSON file
3. In each workflow, open the **Send Email** node and link it to your SMTP credentials (create credentials named "SMTP EnimConnect" with your mail server settings)
4. **Activate** both workflows (toggle at top right)
5. Copy the webhook URLs shown in the Webhook nodes and set them in `backend/.env`:
   ```
   N8N_WEBHOOK_URL=http://localhost:5678/webhook/chef-validation
   N8N_COMPANY_WEBHOOK_URL=http://localhost:5678/webhook/company-decision
   BACKEND_URL=https://your-backend-domain.com
   ```

## Email flow

```
Company submits offer
        │
        ▼
FastAPI POST → N8n webhook (chef-validation)
        │
        ├─► Email to Chef Dept A  [Valider] [Refuser]
        ├─► Email to Chef Dept B  [Valider] [Refuser]
        └─► Email to Chef Dept C  [Valider] [Refuser]

Chef clicks [Valider]
        │
        ▼
FastAPI GET /valider-dept/{id}?token=...
        │
        ├─► Mark validation as "validee"
        ├─► Activate annonce (if first validated dept)
        └─► POST → N8n webhook (company-decision)
                        │
                        ▼
                Email to company: "✅ Validated by Dept A, ⏳ waiting for Dept B"

Chef clicks [Refuser]
        │
        ▼
FastAPI GET /rejeter-form/{id}?token=...   (HTML form)
        │
  Chef enters motif → Submit
        │
        ▼
FastAPI POST /rejeter-dept/{id}
        │
        ├─► Mark validation as "rejetee" with motif
        └─► POST → N8n webhook (company-decision)
                        │
                        ▼
                Email to company: "❌ Refused by Dept A, motif: ..."
```
