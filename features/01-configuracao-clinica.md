# Feature: Configuração da Clínica

## O que a feature faz
Permite que o administrador (Dentista) defina as bases do funcionamento da clínica: quais serviços são prestados, os horários de funcionamento de cada dia e os campos adicionais (anamnese) que o paciente preencherá ao agendar.

## Endpoints Expostos
- `POST /api/services`: Cria um novo serviço (ex: Limpeza, Extração).
- `GET /api/services`: Lista todos os serviços ativos.
- `PUT /api/services/{id}`: Atualiza ou inativa um serviço.
- `POST /api/schedules`: Cadastra horários de atendimento (dias da semana e intervalos).
- `GET /api/schedules`: Retorna os horários configurados.
- `POST /api/form-settings`: Salva a configuração de perguntas adicionais do formulário.

## Onde esses endpoints serão usados
- Serão consumidos primariamente pelo **AgendamentoOdonto-front** (Painel do Administrador) nas telas de "Configurações".
- Os endpoints de `GET` de serviços e horários também serão a base para os cálculos de disponibilidade consumidos pela Landing Page.
