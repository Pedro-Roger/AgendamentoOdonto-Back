# Feature: Prontuário Digital Versionado

## O que a feature faz
Permite ao dentista registrar todo o atendimento clínico. Suporta a criação de um prontuário do zero e a duplicação inteligente (versionamento), onde os dados de um prontuário anterior (ex: Prontuário #001) são copiados para facilitar a criação do atual (Prontuário #002), mantendo o histórico intocado.

## Endpoints Expostos
- `POST /api/medical-records`: Cria um prontuário do zero vinculado a um agendamento.
- `POST /api/medical-records/{id}/duplicate`: Recebe o ID de um prontuário antigo e clona os dados criando um novo registro (gerando nova versão).
- `GET /api/medical-records/{id}`: Retorna os detalhes de um prontuário específico.
- `POST /api/medical-records/{id}/attachments`: Recebe arquivos multipart (fotos, radiografias) e anexa ao prontuário.

## Onde esses endpoints serão usados
- Consumidos pelo **AgendamentoOdonto-front** na tela de Atendimento Clínico (Painel do Dentista).
