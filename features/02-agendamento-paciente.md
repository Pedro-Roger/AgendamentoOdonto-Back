# Feature: Agendamento pelo Paciente

## O que a feature faz
Gerencia a captação de agendamentos vindos do paciente. A lógica central é: o paciente **não cria uma conta (não há login ou registro de usuário)**. O sistema utiliza o **CPF** como chave primária para identificá-lo a cada agendamento. Se o CPF já existe na base, o sistema apenas cria o novo agendamento e anexa ao histórico dele. Se não existe, cria silenciosamente o registro do paciente e o agendamento em uma única transação.

## Endpoints Expostos
- `GET /api/public/available-schedules`: Recebe `serviceId` e `date` e retorna os horários que o dentista tem livre, já descontando os horários que estão ocupados.
- `POST /api/public/appointments`: Recebe todo o payload do formulário da landing page (Nome, CPF, Email, Telefone, Horário, Respostas da anamnese).
    - **Lógica Interna:** Faz um `SELECT` pelo CPF. Se achar, usa o `paciente_id`. Se não achar, faz um `INSERT` em `pacientes` e usa o `id` gerado. Depois, faz `INSERT` em `agendamentos`.

## Onde esses endpoints serão usados
- Consumidos exclusivamente pela **Dra-Herlania-landing-page** (Público).
