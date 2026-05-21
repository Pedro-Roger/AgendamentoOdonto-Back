# Feature: Assinatura Eletrônica e Física

## O que a feature faz
Garante a segurança jurídica do atendimento coletando assinaturas para os prontuários ou termos. Pode ser Física (recebe o upload de uma foto do papel assinado) ou Eletrônica (coleta uma assinatura desenhada na tela junto com metadados como IP e Geolocalização).

## Endpoints Expostos
- `POST /api/signatures/physical`: Recebe o `medicalRecordId` e um arquivo (foto). Salva o anexo marcado como "Assinatura Física".
- `POST /api/signatures/electronic/generate-link`: Gera um token único atrelado a um prontuário para o paciente assinar pelo celular.
- `POST /api/public/signatures/electronic/{token}`: Endpoint público que recebe a imagem base64 da assinatura, Latitude, Longitude. O backend captura o IP do request, verifica o token e vincula tudo ao prontuário como "Assinatura Eletrônica".

## Onde esses endpoints serão usados
- O envio físico e a geração do link são consumidos pelo **AgendamentoOdonto-front**.
- A submissão da assinatura eletrônica pelo token é consumida pela **Dra-Herlania-landing-page** (Rota pública de assinatura).
