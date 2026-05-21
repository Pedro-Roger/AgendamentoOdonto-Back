# Feature: Histórico do Paciente (Perfil 360)

## O que a feature faz
Agrega todas as informações de um paciente (dados pessoais, histórico de agendamentos, lista de prontuários versionados e documentos/assinaturas) em um único payload estruturado.

## Endpoints Expostos
- `GET /api/patients`: Lista todos os pacientes (usado na tabela geral do painel, busca por Nome ou CPF).
- `GET /api/patients/{id}/profile`: Retorna dados cadastrais básicos.
- `GET /api/patients/{id}/timeline`: Retorna a linha do tempo completa do paciente, incluindo os últimos agendamentos, o link para os prontuários e se eles estão assinados ou não.

## Onde esses endpoints serão usados
- Consumidos pelo **AgendamentoOdonto-front** na aba "Pacientes" e na tela de "Detalhes do Paciente".
