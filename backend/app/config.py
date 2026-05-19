from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    OPENAI_API_KEY: str
    # N8n webhook — reçoit les infos d'une nouvelle offre pour notifier les chefs
    N8N_WEBHOOK_URL: str
    # N8n webhook — reçoit la décision (validée/rejetée) pour notifier l'entreprise
    N8N_COMPANY_WEBHOOK_URL: str = ""
    HMAC_SECRET: str
    FRONTEND_URL: str = "http://localhost:5173"
    BACKEND_URL: str = "http://localhost:8000"   # URL publique du backend (pour les liens email)
    STORAGE_PATH: str = "./storage"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Emails des chefs de département (configurables depuis .env)
    CHEF_INFO_EMAIL: str = ""
    CHEF_MAT_EMAIL: str = ""
    CHEF_EM_EMAIL: str = ""
    CHEF_GI_EMAIL: str = ""
    CHEF_GPI_EMAIL: str = ""
    CHEF_ST_EMAIL: str = ""
    CHEF_MINES_EMAIL: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"  # Ignore unknown vars (ex: N8N_SMTP_* utilisées par docker-compose)


settings = Settings()
