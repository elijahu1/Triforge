
---

# Triforge

> Multi-tool IaC pipeline deploying Whisper AI inference on AWS using Pulumi, Terraform, and OpenTofu across isolated infrastructure layers.

## Architecture

```
Pulumi (Python)     → SageMaker endpoint + IAM + Secrets Manager
Terraform (HCL)     → EC2 instance + Security Groups
OpenTofu (HCL)      → S3 remote state backend
Flask (Python)      → Proxy server bridging UI ↔ SageMaker
```

**State backend:** S3 (`remote-state-h1`)  
**Config passing:** AWS Secrets Manager → Flask → UI  
**Model:** [`openai/whisper-small`](https://huggingface.co/openai/whisper-small) via HuggingFace inference container

## Why 3 Tools?

Each tool owns a layer that suits its philosophy:
- **Pulumi** — Python flexibility for SageMaker's complex conditional resources
- **Terraform** — battle-tested HCL for standard compute provisioning
- **OpenTofu** — FOSS Terraform fork managing shared state infrastructure

## Structure

```
triforge/
├── sagemkaer/        # Pulumi — SageMaker + Secrets
├── compute/          # Terraform — EC2
├── storage/          # OpenTofu — S3
└── ui/
    ├── proxy/        # Flask proxy app
    └── public/       # HTML/CSS/JS frontend
```

## Prerequisites

- AWS CLI configured
- Pulumi CLI, Terraform, OpenTofu installed
- Python 3.10+, pip

## Deploy

```bash
# 1. Storage (OpenTofu)
cd storage && tofu init && tofu apply

# 2. SageMaker (Pulumi)
cd sagemkaer && pulumi up

# 3. Compute (Terraform)
cd compute && tf init && tf apply

# 4. UI runs via CI/CD on push to main
```

## Blog

*Coming soon at [triforge](https://dub.sh/triforge)*

---

GitHub description: **Multi-tool IaC pipeline deploying Whisper AI on AWS — Pulumi, Terraform, and OpenTofu each owning an isolated infrastructure layer.**
