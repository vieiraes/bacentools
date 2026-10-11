# Erros do Pix (SPI e DICT): pesquisa nas fontes oficiais do BCB

Gerado em 2026-10-11. Dados completos e rastreáveis em [`src/data/erros-pix.json`](./src/data/erros-pix.json).

**Cobertura:** 46 códigos de rejeição da pacs.002, 4 motivos de devolução da pacs.004, 4 status da pacs.002, 25 tipos de erro do DICT detalhados (grupos Geral e Vínculo) e mais 37 tipos de erro do DICT só listados (reivindicação, infração, devolução, recuperação de valores...). Todos foram conferidos no documento oficial.

Origem: **SPI** = gerado pelo próprio SPI/BCB; **PSP_RECEBEDOR** = gerado pelo PSP do recebedor (ou, nas devoluções, pelo PSP que envia ou recebe a devolução); **DICT** = resposta HTTP da API do DICT.

## Status da pacs.002

| Status | Nome ISO | Significado (BCB) | Quem envia |
|---|---|---|---|
| `ACCC` | AcceptedSettlementCompleted | Notificação do SPI da conclusão da transação ao participante do usuário recebedor. | SPI -> PSP do recebedor |
| `ACSC` | AcceptedSettlementCompletedDebitorAccount | Notificação do SPI da conclusão da transação ao participante do usuário pagador. | SPI -> PSP do pagador |
| `ACSP` | AcceptedSettlementInProcess | Ordem de pagamento aceita após as validações realizadas pelo participante do usuário recebedor. | PSP do recebedor -> SPI |
| `RJCT` | Rejected | Ordem de pagamento/devolução rejeitada pelo SPI ou pelo participante do usuário recebedor por erro de negócio. | PSP do recebedor -> SPI (rejeição de negócio) ou SPI -> PSPs (rejeição do SPI ou repasse da rejeição) |

## Códigos de rejeição da pacs.002 (TxSts = RJCT)

Fonte: Catálogo de Mensagens do SPI 5.13.2, planilha `PACS002.xlsx` (pacs.002.spi.1.18), aba "Tabela de Domínios".

| Código | Nome ISO | Significado (BCB) | Origem | Cenário | O que o PSP pagador faz |
|---|---|---|---|---|---|
| `AB03` (*) | AbortedSettlementTimeout | Liquidação da transação interrompida devido a timeout no SPI. | SPI | O PSP do recebedor não devolveu a pacs.002 a tempo e a liquidação não terminou dentro do limite de 40 s do canal primário; o SPI interrompe a liquidação. | Mostrar que o Pix não foi concluído por tempo esgotado, deixando claro que o erro é do PSP (Requisitos Mínimos UX v7.3, req. 10). Desfazer o bloqueio do valor; nova tentativa exige novo EndToEndId. |
| `AB09` | ErrorCreditorAgent | Transação interrompida devido a erro no participante do usuário recebedor. | PSP_RECEBEDOR | Falha interna no PSP do recebedor ao processar o crédito (ex.: sistema de contas fora do ar). | Mostrar que o Pix NÃO foi realizado por erro de processamento/falha técnica, deixando claro que o erro é do PSP e não do usuário (Requisitos Mínimos UX v7.3, req. 10). Desfazer o bloqueio do valor. |
| `AB11` (*) | TimeoutDebtorAgent | Timeout do participante emissor da ordem de pagamento. | SPI | O SPI atribui o estouro de tempo ao participante emissor da ordem (PSP do pagador ou seu liquidante). Cenário exato não descrito no catálogo; ver "observacao". | Mostrar que o Pix NÃO foi realizado por erro de processamento/falha técnica, deixando claro que o erro é do PSP e não do usuário (Requisitos Mínimos UX v7.3, req. 10). Desfazer o bloqueio do valor. |
| `AC03` | InvalidCreditorAccountNumber | Número da agência e/ou conta transacional do usuário recebedor inexistente ou inválido. | PSP_RECEBEDOR | Pix manual (agência/conta digitadas) para uma conta que não existe no PSP do recebedor. | Mostrar que o Pix NÃO foi realizado porque a conta do destinatário não existe (Requisitos Mínimos UX v7.3, req. 10). Desfazer o bloqueio do valor e orientar a conferir os dados. |
| `AC06` | BlockedAccount | Conta transacional do usuário recebedor encontra-se bloqueada. | PSP_RECEBEDOR | Conta do recebedor bloqueada (ex.: bloqueio cadastral ou judicial que impede créditos). | Mostrar que o Pix NÃO foi realizado e que a conta do destinatário está indisponível (Requisitos Mínimos UX v7.3, req. 10). Desfazer o bloqueio do valor na conta do pagador. |
| `AC07` | ClosedCreditorAccountNumber | Número da conta transacional do usuário recebedor encerrada. | PSP_RECEBEDOR | Conta do recebedor encerrada. | Mostrar que o Pix NÃO foi realizado e que a conta do destinatário está indisponível (Requisitos Mínimos UX v7.3, req. 10). Desfazer o bloqueio do valor na conta do pagador. |
| `AC14` | InvalidCreditorAccountType | Tipo incorreto para a conta transacional do usuário recebedor. | PSP_RECEBEDOR | Tipo de conta informado não confere (ex.: enviado como conta corrente, mas a conta é poupança ou de pagamento). | Mostrar que o Pix NÃO foi realizado e pedir que o usuário confira os dados do recebedor. Desfazer o bloqueio do valor. |
| `AG01` | TransactionForbidden | Transação relativa a ingresso de novos recursos em conta transacional destinados a exploração de loteria de apostas de quota fixa ilegais. | PSP_RECEBEDOR | Pix de entrada de recursos numa conta usada para exploração de apostas de quota fixa (bets) ilegais. | Mostrar que o Pix não foi realizado; não detalhar indícios. Desfazer o bloqueio do valor. |
| `AG03` | TransactionNotSupported | Tipo de transação não é suportado/autorizado na conta transacional do usuário recebedor. Exemplo: transferência para conta salário. | PSP_RECEBEDOR | Transação não aceita pelo tipo de conta, como no exemplo do próprio BCB: transferência para conta salário. | Mostrar que o Pix não foi realizado porque a conta de destino não aceita esse tipo de transação. Desfazer o bloqueio do valor. |
| `AG12` (*) | NotAllowedBookTransfer | Não é permitida ordem de pagamento/devolução no SPI cujos recursos sejam transferidos de uma conta transacional para outra em uma mesma instituição participante ou entre participantes que utilizem o serviço de liquidação de um mesmo participante liquidante no SPI (booktransfer). | SPI | Pagador e recebedor no mesmo PSP (ou PSPs com o mesmo liquidante) e a ordem foi enviada ao SPI em vez de liquidada nos livros (booktransfer). | Erro técnico do PSP pagador ou do seu liquidante (não do usuário): corrigir a mensagem/configuração, desfazer o bloqueio do valor e mostrar "erro de processamento" ao usuário (Requisitos Mínimos UX v7.3, req. 10). |
| `AG13` | ForbiddenReturnPayment | Não é permitido devolver a devolução de um pagamento instantâneo. | SPI | Tentativa de devolver (pacs.004) uma devolução já recebida. | Bloquear a opção "devolver" para créditos que já são devolução; informar que não é permitido devolver uma devolução. |
| `AGNT` | IncorrectAgent | Participante direto não é liquidante do participante do usuário pagador. | SPI | O participante direto que enviou a mensagem não é o liquidante do PSP do pagador. | Erro técnico do PSP pagador ou do seu liquidante (não do usuário): corrigir a mensagem/configuração, desfazer o bloqueio do valor e mostrar "erro de processamento" ao usuário (Requisitos Mínimos UX v7.3, req. 10). |
| `AM01` | ZeroAmount | Ordem de pagamento instantâneo com valor zero. | SPI | Ordem de pagamento com valor R$ 0,00. | Validar no app antes de enviar: valor deve ser maior que zero. |
| `AM02` | NotAllowedAmount | Ordem de pagamento/devolução em valor que faz superar o limite permitido para o tipo de conta transacional creditada. | PSP_RECEBEDOR | O crédito faria a conta do recebedor passar do limite permitido para o tipo de conta (ex.: conta com limite de saldo). | Mostrar que o Pix não foi realizado porque a conta de destino não pode receber esse valor; sugerir valor menor. Desfazer o bloqueio do valor. |
| `AM04` (*) | InsufficientFunds | Saldo insuficiente na conta PI do participante do usuário pagador. | SPI | Saldo insuficiente na Conta PI (conta de liquidação no BCB) do PSP do pagador. Não é o saldo do cliente. | Problema de liquidez do PSP: desfazer o bloqueio do valor e mostrar "erro de processamento" deixando claro que o erro é do PSP; não dizer ao usuário que ele está sem saldo. |
| `AM09` | WrongAmount | Devolução de pagamento em valor que faz superar o valor da ordem de pagamento instantâneo correspondente. | PSP_RECEBEDOR | Devolução (pacs.004) cujo valor, somado às devoluções anteriores, supera o valor do Pix original. Quem rejeita é o PSP que recebe a devolução. | Limitar no app o valor devolvível ao saldo restante do Pix original. |
| `AM12` | InvalidAmount | Divergência entre a somatória dos valores do bloco valorDoDinheiroOuCompra e o campo valor. | SPI | Pix Saque/Troco em que a soma do bloco valorDoDinheiroOuCompra difere do campo valor. | Erro técnico do PSP pagador ou do seu liquidante (não do usuário): corrigir a mensagem/configuração, desfazer o bloqueio do valor e mostrar "erro de processamento" ao usuário (Requisitos Mínimos UX v7.3, req. 10). |
| `AM18` | InvalidNumberOfTransactions | Quantidade de transações inválida. | SPI | Mensagem com quantidade de transações inválida. | Erro técnico do PSP pagador ou do seu liquidante (não do usuário): corrigir a mensagem/configuração, desfazer o bloqueio do valor e mostrar "erro de processamento" ao usuário (Requisitos Mínimos UX v7.3, req. 10). |
| `AM23` | AmountExceedsSettlementLimit | Soma dos tributos informados resulta em valor inválido (superior ao valor da transação). | SPI | Soma dos tributos informados maior que o valor da transação. | Erro técnico do PSP pagador ou do seu liquidante (não do usuário): corrigir a mensagem/configuração, desfazer o bloqueio do valor e mostrar "erro de processamento" ao usuário (Requisitos Mínimos UX v7.3, req. 10). |
| `BE01` | InconsistenWithEndCustomer | CPF/CNPJ do usuário recebedor não é consistente com o titular da conta transacional especificada. | PSP_RECEBEDOR | O CPF/CNPJ informado como recebedor não é o do titular da conta de destino. | Mostrar que o Pix NÃO foi realizado e pedir que o usuário confira os dados do recebedor. Desfazer o bloqueio do valor. |
| `BE05` | UnrecognisedInitiatingParty | CNPJ do iniciador de pagamento não se encontra cadastrado no arranjo Pix. | SPI | Pix via iniciador (ITP) cujo CNPJ não está cadastrado no arranjo Pix. | Erro técnico do PSP pagador ou do seu liquidante (não do usuário): corrigir a mensagem/configuração, desfazer o bloqueio do valor e mostrar "erro de processamento" ao usuário (Requisitos Mínimos UX v7.3, req. 10). |
| `BE15` | InvalidIdentificationCode | Campo idConciliacaoRecebedor indevidamente não preenchido ou preenchido incorretamente. | PSP_RECEBEDOR | Pagamento de cobrança sem o idConciliacaoRecebedor (txid) ou com ele incorreto. | Mostrar que o Pix não foi realizado por problema nos dados da cobrança; sugerir ler o QR Code de novo. |
| `BE17` | InvalidCreditorIdentificationCode | QR Code rejeitado pelo participante do usuário recebedor. | PSP_RECEBEDOR | QR Code rejeitado pelo PSP do recebedor (ex.: cobrança inexistente ou inválida). | Mostrar que o QR Code não pôde ser pago; sugerir pedir um novo QR Code ao recebedor. |
| `CH11` | CreditorIdentifierIncorrect | CPF/CNPJ do usuário recebedor incorreto. | PSP_RECEBEDOR | CPF/CNPJ do recebedor incorreto. | Mostrar que o Pix NÃO foi realizado e pedir que o usuário confira os dados do recebedor. Desfazer o bloqueio do valor. |
| `CH16` | ElementContentFormallyIncorrect | Preenchimento do conteúdo da mensagem incorreto ou incompatível com as regras de negócio. | SPI | Conteúdo da mensagem preenchido de forma incorreta ou incompatível com as regras de negócio. | Erro técnico do PSP pagador ou do seu liquidante (não do usuário): corrigir a mensagem/configuração, desfazer o bloqueio do valor e mostrar "erro de processamento" ao usuário (Requisitos Mínimos UX v7.3, req. 10). |
| `CN01` | AuthorisationCancelled | Agendamento de pagamento recorrente cancelado com statusDoCancelamento igual a "ACCR (confirmado)". | PSP_RECEBEDOR | Pix Automático: o agendamento já tinha sido cancelado (statusDoCancelamento = ACCR) e mesmo assim a ordem foi enviada. | Não enviar ordens de agendamentos cancelados; informar o pagador que o débito foi cancelado. |
| `DS02` | OrderCancelled | Ordem de pagamento rejeitada em função de configurações pré-estabelecidos pelos operadores da instituição no SPI-Web: - bloqueio manual de envio de Pix; - bloqueio automático de envio de Pix; ou - atingimento do limite mínimo operacional da Conta PI. | SPI | O PSP do pagador está com envio de Pix bloqueado no SPI-Web (bloqueio manual ou automático) ou atingiu o limite mínimo operacional da Conta PI. | Erro técnico do PSP pagador ou do seu liquidante (não do usuário): corrigir a mensagem/configuração, desfazer o bloqueio do valor e mostrar "erro de processamento" ao usuário (Requisitos Mínimos UX v7.3, req. 10). |
| `DS04` | OrderRejected | Ordem rejeitada pelo participante do usuário recebedor. | PSP_RECEBEDOR | O PSP do recebedor rejeita a ordem por motivo de conteúdo não coberto por outro código. | Mostrar que o Pix NÃO foi realizado por erro de processamento/falha técnica, deixando claro que o erro é do PSP e não do usuário (Requisitos Mínimos UX v7.3, req. 10). Desfazer o bloqueio do valor. |
| `DS0G` | NotAllowedPayment | Participante que assinou a mensagem não é autorizado a realizar a operação na conta PI debitada. No caso em que o participante que assinou a mensagem não é o titular da conta PI debitada nem é o liquidante no SPI do participante do usuário pagador. | SPI | Quem assinou a mensagem não é titular da Conta PI debitada nem liquidante do PSP do pagador. | Erro técnico do PSP pagador ou do seu liquidante (não do usuário): corrigir a mensagem/configuração, desfazer o bloqueio do valor e mostrar "erro de processamento" ao usuário (Requisitos Mínimos UX v7.3, req. 10). |
| `DS27` (*) | UserNotYetActivated | Participante não se encontra cadastrado ou ainda não iniciou a operação no SPI. | SPI | Participante ainda não cadastrado no SPI ou que não iniciou a operação. | Erro técnico do PSP pagador ou do seu liquidante (não do usuário): corrigir a mensagem/configuração, desfazer o bloqueio do valor e mostrar "erro de processamento" ao usuário (Requisitos Mínimos UX v7.3, req. 10). |
| `DT02` | InvalidCreationDate | Data e Hora do envio da mensagem inválida | SPI | Data/hora de criação da mensagem (CreDtTm) inválida, ex.: data no passado. | Erro técnico do PSP pagador ou do seu liquidante (não do usuário): corrigir a mensagem/configuração, desfazer o bloqueio do valor e mostrar "erro de processamento" ao usuário (Requisitos Mínimos UX v7.3, req. 10). |
| `DT05` (*) | InvalidCutOffDate | Transação extrapola o prazo máximo para devolução de pagamento instantâneo regulamentado pelo arranjo Pix. | SPI | Devolução enviada depois do prazo máximo do arranjo (90 dias da transação original). | Esconder/bloquear a opção de devolução após o prazo; informar que o prazo de devolução expirou. |
| `DU03` | DuplicateTransaction | Ordem de pagamento rejeitada para evitar pagamento em duplicidade, quando a cobrança já tiver sido liquidada por outro arranjo de pagamento, por exemplo, boleto.  | PSP_RECEBEDOR | Pagar por Pix uma cobrança que já foi liquidada por outro meio, ex.: boleto (QR Code no boleto). | Mostrar que a cobrança já foi paga; não debitar o usuário. |
| `DUPL` | DuplicatePayment | Pagamento efetuado em duplicidade nos casos em que as ordens de pagamento possuem IdConciliacaoDoRecebedor iguais para um mesmo usuário recebedor. É permitido que duas cobranças tenham o mesmo IdConciliacaoDoRecebedor desde que correspondam a usuários recebedores diferentes. | PSP_RECEBEDOR | Segundo pagamento com o mesmo idConciliacaoRecebedor para o mesmo recebedor. | Mostrar que a cobrança já foi paga; não debitar o usuário. |
| `ED05` (*) | SettlementFailed | Erro no processamento do pagamento instantâneo (erro genérico). | SPI | Erro genérico de processamento. Pode ser gerado pelo SPI ou pelo PSP do recebedor (o catálogo cita os dois). | Mostrar que o Pix NÃO foi realizado por erro de processamento/falha técnica, deixando claro que o erro é do PSP e não do usuário (Requisitos Mínimos UX v7.3, req. 10). Desfazer o bloqueio do valor. |
| `FF07` | InvalidPurpose | Inconsistência entre a finalidade da transação e o preenchimento do bloco elementos Structured <Strd>. | SPI | Finalidade da transação incoerente com o bloco Structured <Strd> (ex.: finalidade de saque sem os dados de saque). | Erro técnico do PSP pagador ou do seu liquidante (não do usuário): corrigir a mensagem/configuração, desfazer o bloqueio do valor e mostrar "erro de processamento" ao usuário (Requisitos Mínimos UX v7.3, req. 10). |
| `FF08` | InvalidEndToEndId | Identificador da operação mal formatado. | SPI | EndToEndId mal formatado. | Erro técnico do PSP pagador ou do seu liquidante (não do usuário): corrigir a mensagem/configuração, desfazer o bloqueio do valor e mostrar "erro de processamento" ao usuário (Requisitos Mínimos UX v7.3, req. 10). |
| `FRAD` | FraudulentOrigin | Ordem de pagamento rejeitada por fundada suspeita de fraude. | PSP_RECEBEDOR | O PSP do recebedor identificou fundada suspeita de fraude e rejeitou o Pix. | Mostrar que o Pix não foi realizado; não revelar detalhes de prevenção à fraude. Desfazer o bloqueio do valor. |
| `INDT` | InvalidDetails | Conteúdo da mensagem incompatível com os parâmetros atribuídos à cobrança (QR Code) ou à instrução de pagamento (pain.013) que a originou. | PSP_RECEBEDOR | Valor ou dados do Pix diferentes dos parâmetros da cobrança (QR Code) ou da instrução de pagamento (pain.013) que a originou. | Mostrar que o Pix não foi realizado porque os dados não conferem com a cobrança; sugerir ler o QR Code de novo. |
| `MD01` | NoMandate | ISPB do participante facilitador de serviço Pix Saque ou Pix Troco inexistente. | SPI | Pix Saque/Troco com ISPB do facilitador de serviço de saque inexistente. | Erro técnico do PSP pagador ou do seu liquidante (não do usuário): corrigir a mensagem/configuração, desfazer o bloqueio do valor e mostrar "erro de processamento" ao usuário (Requisitos Mínimos UX v7.3, req. 10). |
| `RC09` (*) | InvalidDebtorClearingSystemMemberIdentifier | ISPB do participante do usuário pagador inválido ou inexistente. | SPI | ISPB do PSP do pagador inválido ou inexistente. | Erro técnico do PSP pagador ou do seu liquidante (não do usuário): corrigir a mensagem/configuração, desfazer o bloqueio do valor e mostrar "erro de processamento" ao usuário (Requisitos Mínimos UX v7.3, req. 10). |
| `RC10` (*) | InvalidCreditorClearingSystemMemberIdentifier | ISPB do participante do usuário recebedor inválido ou inexistente. | SPI | ISPB do PSP do recebedor inválido ou inexistente (ex.: Pix manual com instituição errada). | Mostrar que o Pix NÃO foi realizado e pedir que o usuário confira os dados do recebedor. Desfazer o bloqueio do valor. |
| `RR04` | Regulatory Reason | Ordem de pagamento em que o usuário pagador é sancionado por resolução do Conselho de Segurança das Nações Unidas (CSNU). Nos casos em que o usuário recebedor for o sancionado, a ordem de pagamento não deve ser rejeitada. | PSP_RECEBEDOR | Pagador sancionado por resolução do Conselho de Segurança da ONU (CSNU). Se o sancionado for o recebedor, a ordem NÃO deve ser rejeitada. | Mostrar que o Pix não foi realizado; não detalhar o motivo regulatório. |
| `RR06` | TaxInformationInvalid | O bloco de elementos somente poderá ser preenchido quando os campos cpfCnpjUsuarioPagador e cpfCnpjUsuarioRecebedor forem ambos Pessoa Jurídica (14 caracteres) e o campo formaDeIniciacao for igual a 'QRES', 'APES', 'MANU' ou 'DICT'. | SPI | Bloco de tributos preenchido quando pagador e recebedor não são ambos PJ ou a formaDeIniciacao não é QRES, APES, MANU ou DICT. | Erro técnico do PSP pagador ou do seu liquidante (não do usuário): corrigir a mensagem/configuração, desfazer o bloqueio do valor e mostrar "erro de processamento" ao usuário (Requisitos Mínimos UX v7.3, req. 10). |
| `SL02` | SpecificServiceOfferedByCreditorAgent | A transação referenciada na mensagem de devolução (pacs.004) original não está relacionada aos serviços de Pix Saque ou Pix Troco. | PSP_RECEBEDOR | Devolução com motivo SL02 para um Pix que não é Pix Saque nem Pix Troco; o PSP que recebe a devolução rejeita. | Usar SL02 só em devoluções de Pix Saque/Troco. |
| `UPAY` | UnduePayment | Pagamento é indevido por ausência de recorrência válida/ativa. | PSP_RECEBEDOR | Pix Automático sem recorrência válida/ativa. | Não enviar ordens sem recorrência ativa; informar o pagador. |

(*) = há observação no JSON (dedução, histórico ou ressalva).

## Motivos de devolução da pacs.004

Fonte: `PACS004.xlsx`, aba "Tabela de Domínios", campo `RtrRsnInf/Rsn/Cd`.

| Código | Nome ISO | Significado (BCB) | Cenário |
|---|---|---|---|
| `BE08` | BankError | Devolução de pagamento iniciada pelo participante do usuário recebedor no âmbito do Mecanismo Especial de Devolução. Deve ser preenchido sempre que uma solicitação de devolução for iniciada pelo participante do usuário pagador com o motivo falha operacional do PSP do pagador ou sempre que a devolução for iniciada pelo participante do usuário recebedor por falha operacional em seus próprios sistemas. | Devolução por falha operacional (do PSP do pagador ou do próprio PSP que devolve), no âmbito do MED. |
| `FR01` | Fraud | Devolução de pagamento, iniciada pelo participante do usuário recebedor no âmbito do Mecanismo Especial de Devolução, motivada por fundada suspeita de fraude. Deve ser preenchido sempre que uma solicitação de devolução for iniciada pelo participante do usuário pagador com o motivo fundada suspeita de fraude ou sempre que a devolução for iniciada pelo participante do usuário recebedor por fundada suspeita de fraude. | Devolução por fundada suspeita de fraude, no âmbito do MED (ex.: golpe confirmado depois de notificação de infração no DICT). |
| `MD06` | RefundRequestByEndCustomer | Devolução de pagamento solicitado pelo usuário recebedor. | O próprio recebedor decide devolver o Pix (ex.: cliente pediu estorno de uma compra). |
| `SL02` | SpecificServiceOfferedByCreditorAgent | Devolução de pagamento solicitada pelo usuário recebedor motivada por um erro na transação ou desacordo entre as partes relacionados ao Pix Saque ou ao Pix Troco. | Devolução de Pix Saque ou Pix Troco por erro na transação ou desacordo entre as partes. |

`SL02` aparece nas duas tabelas com sentidos diferentes: como **motivo de devolução** (pacs.004) e como **rejeição** (pacs.002), esta usada quando a devolução SL02 cita um Pix que não é Saque/Troco.

## admi.002 (erro de formato ou assinatura)

- **admi.002**: Rejeição de mensagem por erro de formato, assinatura ou processamento, emitida pelo SPI/ICOM. Sem código ISO: RjctgPtyRsn em texto livre (máx. 35 caracteres), ex.: "Assinatura XML inválida", "XML inválido" ou "Erro no processamento do SPI"; ErrorLocation, RsnDesc e AddtlData (EndToEndId=... / ReturnId=...) são opcionais. Ref: PI-ResourceId (33 caracteres, começa com R) ou MsgId.
- **admi.004**: Notificação de evento do sistema (EvtCd = "SPI", EvtDesc em texto livre). Não é rejeição de transação.

## Erros da API do DICT (Geral e Vínculo)

Fonte: API DICT v2.12.1, seção "Tratamento de erros". O corpo da resposta segue o formato problem details (RFC 7807), com `type = https://dict.pi.rsfn.net.br/api/v2/error/<Tipo>`.

| Tipo | HTTP | Significado (BCB) | Cenário / tratamento |
|---|---|---|---|
| `Forbidden` | 403 | Requisição de participante autenticado viola alguma regra de autorização | Participante autenticado tenta uma operação que não pode fazer (regra de autorização). Erro técnico do PSP: mostrar falha técnica ao usuário. |
| `BadRequest` | 400 | Requisição com formato inválido | Requisição ao DICT com formato inválido. Validar a chave antes de enviar; se o formato for inválido, a chave nem deve ir ao DICT (Requisitos Mínimos UX v7.3, req. 04). |
| `NotFound` | 404 | Entidade não encontrada | Chave consultada não existe no DICT (ex.: e-mail digitado errado). Na consulta, cada 404 também consome fichas do balde antivarredura (20 fichas por usuário, 3 por participante). Mostrar que o Pix não foi realizado e que a chave não existe ou está indisponível (Requisitos Mínimos UX v7.3, req. 05). |
| `ResourceConflict` | 409 | Este recurso está sendo processado por outra operação no momento. Indica-se que a requisição seja feita novamente em instantes. | O recurso está sendo processado por outra operação naquele momento. Repetir a requisição em instantes. |
| `Gone` | 410 | Recurso não está mais disponível |  Ver a descrição; tratamento não detalhado na fonte. |
| `RateLimited` | 429 | Limite de requisições foi atingido Ver seção sobre limitação de requisições | Muitas consultas de chave pelo mesmo usuário ou participante (balde de fichas zerado, política antivarredura). Não deixar o usuário repetir a consulta; mostrar falha e pedir para tentar mais tarde. |
| `InternalServerError` | 500 | Condição inesperada ao processar requisição. | Condição inesperada no DICT. Mostrar falha de comunicação e pedir nova tentativa (Requisitos Mínimos UX v7.3, req. 08). |
| `ServiceUnavailable` | 503 | Serviço não está disponível no momento. Pode estar em manutenção ou fora da janela de funcionamento. | DICT em manutenção ou fora da janela de funcionamento. Mostrar falha de comunicação e pedir nova tentativa (Requisitos Mínimos UX v7.3, req. 08). |
| `RequestSignatureInvalid` | 400 | Assinatura digital da requisição enviada é inválida. |  Ver a descrição; tratamento não detalhado na fonte. |
| `RequestIdAlreadyUsed` | 400 | Requisição foi feita com mesmo `RequestId` de requisição feita anteriormente, mas com parâmetros diferentes. |  Ver a descrição; tratamento não detalhado na fonte. |
| `InvalidReason` | 400 | Requisição foi feita com uma razão inválida para a operação |  Ver a descrição; tratamento não detalhado na fonte. |
| `ParticipantInvalid` | 400 | O participante não pode participar na operação solicitada. |  Ver a descrição; tratamento não detalhado na fonte. |
| `TaxIdNumberBlocked` | 400 | O CPF/CNPJ encontra-se bloqueado por ordem judicial. |  Ver a descrição; tratamento não detalhado na fonte. |
| `UserOrAccountWithFraudRelatedRestriction` | 400 | Conta/usuário com restrição motivada por fundada suspeita de fraude em transações Pix. |  Ver a descrição; tratamento não detalhado na fonte. |
| `DeprecatedResource` | 410 | Este recurso foi deprecado. |  Ver a descrição; tratamento não detalhado na fonte. |
| `EntryInvalid` | 400 | Existem campos inválidos ao tentar criar ou atualizar vínculo |  Ver a descrição; tratamento não detalhado na fonte. |
| `EntryLimitExceeded` | 400 | Número de vínculos associados a conta transacional excedeu o limite máximo | No cadastro de chave: a conta já tem o número máximo de chaves. Informar o limite e sugerir excluir uma chave. |
| `EntryAlreadyExists` | 400 | Já existe vínculo para essa chave com o mesmo participante e dono | No cadastro de chave: a mesma chave já existe para o mesmo dono e PSP. Informar que a chave já está cadastrada. |
| `EntryCannotBeQueriedForBookTransfer` | 400 | Vínculo consultado está custodiado no mesmo PSP do usuário pagador para quem está sendo feita a consulta. Quando o pagador e o recebedor estão no mesmo PSP, não deve ser feita consulta ao DICT. | A chave pertence a um cliente do mesmo PSP do pagador; nesse caso o PSP não deve consultar o DICT. Erro do PSP: resolver a chave na própria base e liquidar internamente. |
| `EntryKeyOwnedByDifferentPerson` | 400 | Já existe vínculo para essa chave mas ela é possuída por outra pessoa. Indica-se que seja feita uma reivindicação de posse. | No cadastro de chave: a chave já é de outra pessoa. Oferecer ao usuário abrir reivindicação de posse. |
| `EntryKeyInCustodyOfDifferentParticipant` | 400 | Já existe vínculo para essa chave com o mesmo dono, mas ela encontra-se associada a outro participante. Indica-se que seja feita uma reivindicação de portabilidade. | No cadastro de chave: a chave é do mesmo dono, mas está em outro PSP. Oferecer ao usuário abrir reivindicação de portabilidade. |
| `EntryLockedByClaim` | 400 | Existe uma reivindicação com status diferente de concluída ou cancelada para a chave do vínculo. Enquanto estiver nessa situação, o vínculo não pode ser excluído. |  Ver a descrição; tratamento não detalhado na fonte. |
| `EntryTaxIdNumberByDifferentOwner` | 400 | CPF/CNPJ do vínculo diferente do CPF/CNPJ do dono da chave. |  Ver a descrição; tratamento não detalhado na fonte. |
| `EntryBlocked` | 400 | O vínculo encontra-se bloqueado por ordem judicial e não pode ser consultado. | A chave consultada está bloqueada por ordem judicial. Mostrar que a chave está indisponível (Requisitos Mínimos UX v7.3, req. 05). |
| `EntryWithFraudRelatedRestriction` | 400 | O vínculo encontra-se bloqueado devido à associação da conta/usuário com restrição motivada por fundada suspeita de fraude em transações Pix. | A chave está bloqueada porque a conta/usuário tem restrição por fundada suspeita de fraude. Mostrar que a chave está indisponível (Requisitos Mínimos UX v7.3, req. 05). |

Os outros 37 tipos de erro (reivindicação, notificação de infração, marcação de fraude, solicitação de devolução, recuperação de valores) estão em `dictOutrosTiposDeErro` no JSON.

## Prazos

| Prazo | Valor | Fonte |
|---|---|---|
| Tempo máximo de um Pix enviado ao canal primário do SPI (de t0', quando o PSP do pagador recebe a ordem, até t4, a liquidação). Passou disso, o Pix é rejeitado, sempre pelo SPI. | 40 segundos | Manual de Tempos do Pix, Seção 1.1, p. 3 |
| Tempo máximo de um Pix enviado ao canal secundário (Pix Agendado e Pix Cobrança com vencimento agendado: pacs.008 NORM + PAGAGD), contado de t1' a t4. | 45 minutos | Manual de Tempos do Pix, Seção 1.2, p. 3-4 |
| Ordens liquidadas fora do SPI (livros do PSP): 40 s, ou 45 min para agendados. A rejeição cabe ao participante liquidante. | 40 segundos / 45 minutos | Manual de Tempos do Pix, Seção 1.3, p. 4 |
| Tempo máximo para o PSP do pagador autorizar uma transação com suspeita de fraude (exceto saque/troco e Transferências Inteligentes). Durante a análise, o usuário deve ser avisado e poder cancelar. | 30 minutos (8h-20h em dias úteis) / 60 minutos (demais horários) | Manual de Tempos do Pix, Seção 2, p. 5 |
| ANS do PSP do recebedor para responder a pacs.008 (t3' - t2). Operações interrompidas por timeout no SPI não entram no cálculo. | p50 1,4 s; p95 2,3 s | Manual de Tempos do Pix, Seção 4.1.1.2, p. 10 |
| ANS do PSP do pagador (ou seu liquidante) na iniciação (t1 - t0'). | p95 1,5 s | Manual de Tempos do Pix, Seção 4.1.1.1, p. 9-10 |
| Experiência do usuário pagador, do pedido até o aviso de conclusão (t6a - t0'). | p50 6,0 s; p99 10,0 s | Manual de Tempos do Pix, Seção 4.1.2.1, p. 11 |
| O PSP do destinatário da devolução verifica se ela "atende ao prazo de noventa dias". Fora do prazo, o SPI rejeita com DT05. | 90 dias da transação original | Manual de Fluxos do Processo de Efetivação do Pix, Seção 4.1, etapa 9, p. 52 |
| Bloqueio cautelar pelo PSP do recebedor, em caso de suspeita de fraude, simultâneo ao crédito. | até 72 horas | Resolução BCB nº 1/2020: Regulamento do arranjo Pix (texto compilado), Art. 39-B, § 4º |
| Balde antivarredura da consulta de chave por usuário final (ENTRIES_READ_USER_ANTISCAN e _V2): 200 tira 1 ficha, 404 tira 20 e um Pix enviado devolve 1 (PF) ou 2 (PJ). Balde zerado gera HTTP 429 RateLimited. | PF: 2 fichas/min, balde de 100; PJ: 20 fichas/min, balde de 1.000 | Especificação da API do DICT, Segurança > Limitação de requisições > Regras de contagem das políticas |
| Balde antivarredura por participante (ENTRIES_READ_PARTICIPANT_ANTISCAN): 200 tira 1 ficha, 404 tira 3 e um Pix enviado devolve 1. | Categoria A: 25.000/min, balde de 50.000 ... Categoria H: 2/min, balde de 50 | Especificação da API do DICT, Segurança > Limitação de requisições > Regras de contagem das políticas |
| Pix Automático: resposta pain.012 à solicitação de permissão (1 min); confirmação da autorização pelo PSP do recebedor (1 h); confirmação de cancelamento pain.011->pain.012 e camt.055->camt.029 (12 h). | 1 min / 1 h / 12 h | Manual de Tempos do Pix, Seções 3.1 a 3.4, p. 5-7 |

## Fluxos-modelo

### Pix com liquidação imediata entre participantes diretos (sucesso)

1. **Usuário pagador → PSP do pagador**: `(canal do PSP)`. Pagador confirma a ordem (t0').
2. **PSP do pagador → PSP do pagador**: `(ação interna)`. Bloqueia o valor na conta do pagador.
3. **PSP do pagador → SPI**: `pacs.008`. Ordem de pagamento (t1 criação, t1' recebimento).
4. **SPI → SPI**: `(ação interna)`. Bloqueia o valor na Conta PI do PSP do pagador.
5. **SPI → PSP do recebedor**: `pacs.008`. Repassa os dados da transferência (t2).
6. **PSP do recebedor → SPI**: `pacs.002 TxSts=ACSP`. Valida a conta, anota crédito provisório e aceita (t3').
7. **SPI → SPI**: `(ação interna)`. Troca de saldos nas Contas PI: finality (t4).
8. **SPI → PSP do recebedor**: `pacs.002 TxSts=ACCC`. Confirmação de conclusão; o PSP credita o recebedor e o notifica.
9. **SPI → PSP do pagador**: `pacs.002 TxSts=ACSC`. Confirmação de conclusão (t5a); o PSP efetiva o débito e notifica o pagador (t6a).

Códigos: `ACSP`, `ACCC`, `ACSC`

Fonte: Manual de Fluxos do Processo de Efetivação do Pix, Seção 3.1.1, etapas 1-21, p. 30-31; nomes das mensagens e status: Manual de Tempos 7.0 seção 4.1 (t0'...t6a) e PACS002.xlsx (TxSts).

> O Manual de Fluxos descreve as etapas sem citar o nome das mensagens. Os nomes pacs.008/pacs.002 e os status vêm do Manual de Tempos 4.1 e do catálogo.

### Rejeição pelo PSP do recebedor (ex.: conta encerrada, AC07)

1. **PSP do pagador → SPI**: `pacs.008`. Ordem de pagamento.
2. **SPI → PSP do recebedor**: `pacs.008`. Repasse da ordem.
3. **PSP do recebedor → SPI**: `pacs.002 TxSts=RJCT, Rsn/Cd=AC07`. Recebedor valida a conta e rejeita (Regulamento, art. 39: problemas na identificação do recebedor, fraude etc.).
4. **SPI → PSP do pagador**: `pacs.002 TxSts=RJCT`. Rejeição comunicada ao PSP do pagador; nenhuma troca de saldo nas Contas PI.
5. **PSP do pagador → Usuário pagador**: `(canal do PSP)`. Desbloqueia o valor e mostra a mensagem específica (UX req. 10: "conta do destinatário indisponível").

Códigos: `AC03`, `AC06`, `AC07`, `AC14`, `AG03`, `AM02`, `BE01`, `CH11`, `DS04`, `FRAD`, `RR04`, `BE17`, `INDT`, `DU03`, `DUPL`

Fonte: Catálogo de Mensagens do SPI: definições detalhadas (spi.5.13.2.zip: planilhas xlsx, XSDs, exemplos e Notas de Versão), PACS002.xlsx, Tabela de Domínios (TxSts RJCT; códigos com "Participante que gera o Erro: Participante do usuário recebedor").

> O Manual de Fluxos v2.1 não tem tabela de etapas para a rejeição. A sequência foi montada a partir do catálogo (quem gera cada código) e dos arts. 39 e 39-A do Regulamento. O repasse do RJCT ao PSP do pagador é inferência.

### Rejeição pelo próprio SPI (ex.: Conta PI do PSP do pagador sem saldo, AM04; envio bloqueado no SPI-Web, DS02)

1. **PSP do pagador → SPI**: `pacs.008`. Ordem de pagamento.
2. **SPI → PSP do pagador**: `pacs.002 TxSts=RJCT, Rsn/Cd=AM04`. O SPI rejeita na validação de negócio; a ordem não chega ao PSP do recebedor.
3. **PSP do pagador → Usuário pagador**: `(canal do PSP)`. Desbloqueia o valor; mostra "erro de processamento" deixando claro que o erro é do PSP.

Códigos: `AM04`, `DS02`, `AM01`, `AG12`, `AGNT`, `BE05`, `CH16`, `DS0G`, `DS27`, `DT02`, `FF07`, `FF08`, `MD01`, `RC09`, `RC10`, `AM12`, `AM18`, `AM23`, `RR06`

Fonte: Catálogo de Mensagens do SPI: definições detalhadas (spi.5.13.2.zip: planilhas xlsx, XSDs, exemplos e Notas de Versão), PACS002.xlsx, Tabela de Domínios (códigos com "Participante que gera o Erro: SPI").

> Que a ordem rejeitada pelo SPI não segue ao recebedor é inferência a partir da ordem das etapas do Manual de Fluxos 3.1.1 (bloqueio na Conta PI na etapa 5, antes do repasse na etapa 6).

### Mensagem inválida ou assinatura inválida (admi.002)

1. **PSP do pagador → SPI (ICOM)**: `pacs.008 com XML malformado ou assinatura XMLDSig inválida`. Falha na validação de formato ou assinatura.
2. **SPI (ICOM) → PSP do pagador**: `admi.002`. RjctgPtyRsn em texto livre, ex.: "Assinatura XML inválida" / "XML inválido", ou "Erro no processamento do SPI"; AddtlData pode trazer EndToEndId=...

Fonte: Catálogo de Mensagens do SPI: definições detalhadas (spi.5.13.2.zip: planilhas xlsx, XSDs, exemplos e Notas de Versão), ADMI002.xlsx (aba admi.002, campos RjctgPtyRsn/RsnDesc/AddtlData; a Tabela de Domínios não tem códigos) e exemplos/admi002/admi.002_SPI_M_msg.xml e admi.002_SPI_R_msg.xml.

> A admi.002 não tem código ISO de motivo: o erro vem em texto livre (até 35 caracteres no RjctgPtyRsn).

### Timeout: PSP do recebedor não responde a tempo

1. **PSP do pagador → SPI**: `pacs.008`. Ordem de pagamento (canal primário).
2. **SPI → PSP do recebedor**: `pacs.008`. Repasse da ordem.
3. **PSP do recebedor → -**: `(sem pacs.002)`. Não responde antes do limite (40 s contados de t0').
4. **SPI → PSP do pagador e PSP do recebedor**: `pacs.002 TxSts=RJCT, Rsn/Cd=AB03`. O SPI interrompe a liquidação e comunica os participantes; o bloqueio na Conta PI é desfeito.
5. **PSP do pagador → Usuário pagador**: `(canal do PSP)`. Desbloqueia o valor; mostra "tempo extrapolado", deixando claro que o erro é do PSP (UX req. 10).

Códigos: `AB03`

Fonte: Manual de Tempos do Pix, Seção 1.1, p. 3 ("A rejeição do Pix, após o recebimento da ordem pelo SPI (t1'), é sempre efetivada pelo SPI e comunicada aos participantes"); código AB03: PACS002.xlsx linha R7; exemplo pacs.002_ERRO_1_msg.xml (RJCT + AB03).

> Usar AB03 nesse cenário é dedução (ver observação do código AB03). Que o PSP do recebedor também recebe o RJCT segue de "comunicada aos participantes".

### Devolução (pacs.004) entre participantes diretos

1. **Usuário recebedor original → PSP remetente (recebedor original)**: `(canal do PSP)`. Pede a devolução (MD06), ou o PSP inicia via MED (BE08/FR01), ou o caso é Saque/Troco (SL02).
2. **PSP remetente → SPI**: `pacs.004`. RtrRsnInf/Rsn/Cd = BE08 | FR01 | MD06 | SL02; SttlmPrty HIGH ou NORM.
3. **SPI → PSP destinatário (pagador original)**: `pacs.004`. Repasse da devolução (o SPI rejeita antes com DT05 se o prazo passou, AG13 se for devolução de devolução).
4. **PSP destinatário → SPI**: `pacs.002 TxSts=ACSP ou RJCT`. Confere o prazo de 90 dias, se o destinatário é cliente, o valor (AM09 se exceder) e se a conta está ativa.
5. **SPI → PSP destinatário**: `pacs.002 TxSts=ACCC`. Confirmação; credita o destinatário.
6. **SPI → PSP remetente**: `pacs.002 TxSts=ACSC`. Confirmação; debita o remetente.

Códigos: `BE08`, `FR01`, `MD06`, `SL02`, `AM09`, `DT05`, `AG13`

Fonte: Manual de Fluxos do Processo de Efetivação do Pix, Seção 4.1, etapas 1-23, p. 51-52; motivos: PACS004.xlsx, Tabela de Domínios; rejeições: PACS002.xlsx.

> O Manual de Fluxos não cita nomes de mensagens. Os nomes pacs.004/pacs.002 vêm do catálogo (pacs.002 OrgnlInstrId "ordem de pagamento ou de sua devolução"; RJCT "Ordem de pagamento/devolução rejeitada").

### Consulta de chave no DICT antes do Pix (com erros possíveis)

1. **Usuário pagador → PSP do pagador**: `(canal do PSP)`. Informa a chave. Formato inválido: a chave nem vai ao DICT (UX req. 04).
2. **PSP do pagador → DICT**: `GET /entries/{Key}`. Consulta do vínculo (headers PI-RequestingParticipant, PI-PayerId...).
3. **DICT → PSP do pagador**: `HTTP 200 GetEntryResponse | 400 | 404 NotFound | 429 RateLimited (problem+xml)`. Respostas possíveis da operação getEntry.
4. **PSP do pagador → Usuário pagador**: `(canal do PSP)`. Com 200, mostra os dados do recebedor para confirmação; com 404/EntryBlocked, "chave inexistente ou indisponível" (req. 05); falha de comunicação, req. 08.

Códigos: `NotFound`, `RateLimited`, `BadRequest`, `EntryBlocked`, `EntryWithFraudRelatedRestriction`, `EntryCannotBeQueriedForBookTransfer`, `ServiceUnavailable`, `Forbidden`

Fonte: Especificação da API do DICT, Operação GET /entries/{Key} ("Consultar Vínculo", respostas 200/400/404/429); tabela "Tratamento de erros"; passos do fluxo: Manual de Fluxos 2.1, seção 2.1.1, etapas 1-13, p. 5.

## O que não foi confirmado

- **DS0H (NotAllowedAccount)**: Existiu: incluído no catálogo 5.02.1 (pacs.002 v1.5) e EXCLUÍDO na pacs.002 v1.9 (Notas de Versão). Não está na tabela vigente (5.13.2).
- **DS24 (WaitingTimeExpired)**: Incluído na pacs.002 v1.9 (tempo entre a pain.013 e a pacs.008) e EXCLUÍDO na pacs.002 v1.12. Não está na tabela vigente.
- **BE15**: Excluído na v1.9 e reincluído na v1.12 com outro significado (idConciliacaoRecebedor). Vigente.
- **EntryNotFound (DICT)**: Esse tipo não existe na API DICT v2.12.1. A chave inexistente retorna o tipo genérico NotFound (HTTP 404).
- **Código usado pelo SPI no timeout do recebedor**: Nenhum texto oficial liga literalmente "recebedor não respondeu" a AB03. A associação é deduzida do texto do AB03 e do Manual de Tempos (ver observação do AB03).
- **Cenário exato do AB11 (TimeoutDebtorAgent)**: O catálogo só traz "Timeout do participante emissor da ordem de pagamento"; o momento exato do disparo não está descrito.
- **Repasse do RJCT do recebedor ao PSP do pagador**: Os fluxos oficiais (Manual de Fluxos v2.1) só detalham o caminho de sucesso. A propagação do RJCT com o mesmo código ao pagador é inferência, coerente com o catálogo ("Ordem de pagamento/devolução rejeitada pelo SPI ou pelo participante do usuário recebedor").
- **Códigos de erro de outras mensagens (pain.014, camt.029, pain.012, camt.025...)**: Não catalogados aqui: a pesquisa cobriu pacs.002, pacs.004 e admi.002. As tabelas estão no mesmo zip (xlsx/PAIN014.xlsx, CAMT029.xlsx etc.).
- **Manual Operacional do DICT e Regulamento do SPI (Res. BCB 195/2022)**: Não baixados. Os tempos citados vêm do Manual de Tempos, que remete à Res. BCB 195/2022.
- **Versões futuras**: Manual de Fluxos v2.2 (vigência 01/02/2027) e Requisitos Mínimos UX v7.4 (vigência 01/03/2027) existem, mas não foram analisados.

## Fontes

- **Catálogo de Mensagens do SPI: definições detalhadas (spi.5.13.2.zip: planilhas xlsx, XSDs, exemplos e Notas de Versão)**, versão 5.13.2 (pacs.002.spi.1.18; pacs.004 v1.4+; admi.002.spi.1.5) (2026-10-02). <https://www.bcb.gov.br/content/estabilidadefinanceira/cedsfn/Catalogos/spi.5.13.2.zip>. Fonte principal dos códigos ISO. Indicado como referência nº 1 do Catálogo de Serviços do SFN, Vol. VI. As planilhas trazem, para cada código, o "Participante que gera o Erro".
- **Catálogo de Serviços do SFN, Volume VI: Pagamentos Instantâneos**, versão 5.13 (2026-07-24 (arquivo spi.5.13.2.zip publicado em 2026-10-02)). <https://www.bcb.gov.br/content/estabilidadefinanceira/cedsfn/Catalogos/Catalogo_de_Servicos_do_SFN_Volume_VI_Versao_513.pdf>. Explica a estrutura do zip, os canais, a idempotência e a lista de mensagens. Não traz a tabela de códigos, que fica no zip.
- **Catálogo de Mensagens do SPI: Notas de Versão**, versão 5.13.2 (2026-10-02). <https://www.bcb.gov.br/content/estabilidadefinanceira/cedsfn/Catalogos/spi.5.13.2.zip>. Arquivo NotasDeVersao.pdf dentro do zip. Usado para o histórico de códigos incluídos e excluídos (DS0H, DS24, BE15, AG01, DS02, DU03).
- **Manual de Tempos do Pix**, versão 7.0 (2025-11-23 (último registro no histórico: 2026-02-02)). <https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/IX_ManualdeTemposdoPix.pdf>. Limites de tempo (40 s / 45 min), quem rejeita por timeout e indicadores de ANS (t0' a t6a).
- **Manual de Fluxos do Processo de Efetivação do Pix**, versão 2.1 (vigente; a 2.2 entra em vigor em 01/02/2027) (2025-06-05). <https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/III_ManualdeFluxosdoProcessodeEfetivacaodoPix.pdf>. Fluxos passo a passo de consulta ao DICT (2.1.1), liquidação imediata (3.1.1) e devolução (4.1). Descreve só o caminho feliz; as rejeições não são detalhadas em etapas.
- **Especificação da API do DICT**, versão 2.12.1 (não informada na página). <https://www.bcb.gov.br/content/estabilidadefinanceira/pix/API-DICT.html>. Página Redoc com o OpenAPI embutido. A tabela de erros fica na seção "Tratamento de erros"; o rate limiting fica em "Segurança > Limitação de requisições".
- **Requisitos Mínimos para a Experiência do Usuário (Pix)**, versão 7.3 (a 7.4 entra em vigor em 01/03/2027) (2025-12). <https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/IV_RequisitosMinimosparaExperienciadoUsuario.pdf>. Mensagens obrigatórias ao usuário: formato de chave inválido (req. 04), chave não encontrada/bloqueada (req. 05), falha de comunicação com o DICT (req. 08) e erros de liquidação (req. 10), jornada de pagamento por chave, p. 13-15.
- **Resolução BCB nº 1/2020: Regulamento do arranjo Pix (texto compilado)**, versão versão normativa 43 (texto consolidado no site do BCB) (2020-08-12 (com alterações posteriores)). <https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolu%C3%A7%C3%A3o%20BCB&numero=1>. Arts. 38 e 39 (rejeição pelo PSP do pagador e pelo do recebedor), 39-B (bloqueio cautelar de até 72 h) e 40/41 (devolução). Lido pela API do site do BCB (api/conteudo/app/normativos/exibenormativo).
