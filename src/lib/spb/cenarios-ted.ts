// Cenários da TED para a animação: a mesma sequência de mensagens que o catálogo descreve (Fluxo2: requisição, R1 ao emissor,
// R2 ao terceiro) e as situações do Dicionário de Domínios. Onde o catálogo não diz algo com todas as letras, o campo `deducao` explica.
import type { Scenario } from '@/features/fluxo/model';
import { descricaoDominio, erroSpbPorCodigo } from './catalogo';
import { FLUXO2, GRUPOS, RETORNO_COM_ERRO, type Trecho } from './textos';

export interface CenarioTed extends Scenario {
  grupo: 'STR' | 'PAG';
  /** mensagens envolvidas (viram links para o explorador) */
  mensagens: string[];
  /** situação final no domínio SitLancSTR/SitLancPAG, quando a TED passa por ela */
  situacoes?: string[];
  /** código de erro do cenário (Relação de Códigos de Erros) */
  erro?: string;
  notas: Trecho[];
  deducao?: string;
}

const sit = (c: string) => `situação ${c} (“${descricaoDominio('SitLancSTR', c)}”)`;

const STR_SALDO: Trecho = {
  texto: 'Antes de efetivar o débito, o STR verifica se há saldo suficiente. Não havendo, a operação é rejeitada ou inserida na fila de pendências, de acordo com a natureza da operação. O titular da conta a ser creditada só é informado do crédito após a efetivação.',
  fonte: 'Catálogo 5.13, Volume I, Grupo de Serviços STR (p. 251)',
};
const AVISO_DEBITADA = 'O catálogo não detalha com qual mensagem o STR avisa a IF debitada quando a TED pendente é efetivada mais tarde; a animação mostra só o aviso à IF creditada (R2), que o catálogo garante.';

export const CENARIOS_TED: CenarioTed[] = [
  {
    id: 'ted-efetivada',
    title: 'TED efetivada no STR',
    summary: 'Caminho feliz: a IF do cliente envia a STR0008, o STR liquida na hora e responde aos dois bancos.',
    grupo: 'STR',
    mensagens: ['STR0008', 'STR0008R1', 'STR0008R2'],
    situacoes: ['1'],
    playLabel: 'Enviar a TED',
    okLabel: 'TED efetivada',
    steps: [
      { from: 'IF_DEBITADA', to: 'STR', message: 'STR0008', money: true, label: 'A IF do cliente pede a transferência entre contas de clientes: contas, CPF/CNPJ, nomes, valor e finalidade.' },
      { from: 'STR', to: ['IF_DEBITADA', 'IF_CREDITADA'], message: 'STR0008R1 + STR0008R2', outcome: 'ok', label: `Há saldo: o STR liquida na hora. A R1 volta à IF debitada com o número de controle do STR e a ${sit('1')}; a R2 avisa a IF creditada, que credita a conta do cliente.` },
    ],
    notas: [GRUPOS.STR.resumo, STR_SALDO, FLUXO2],
  },
  {
    id: 'ted-pendente',
    title: 'TED pendente por falta de saldo',
    summary: 'A IF debitada não tem saldo no STR: a TED vai para a fila e o banco de quem recebe só fica sabendo quando ela é efetivada.',
    grupo: 'STR',
    mensagens: ['STR0008', 'STR0008R1', 'STR0008R2'],
    situacoes: ['17', '24'],
    playLabel: 'Enviar a TED',
    okLabel: 'TED efetivada depois da fila',
    steps: [
      { from: 'IF_DEBITADA', to: 'STR', message: 'STR0008', money: true, outcome: 'espera', label: 'O STR confere o saldo da IF debitada: não é suficiente. A TED entra na fila de pendências.' },
      { from: 'STR', to: 'IF_DEBITADA', message: 'STR0008R1 · situação 17', outcome: 'espera', label: `A R1 informa a ${sit('17')}. A IF creditada ainda não sabe de nada.` },
      { from: 'STR', to: 'IF_CREDITADA', message: 'STR0008R2', outcome: 'ok', money: true, label: `Entra saldo: o STR efetiva a TED e só então avisa a IF creditada. Se o saldo não chegar até o fechamento, a pendência é rejeitada (${sit('24')}).` },
    ],
    notas: [STR_SALDO, GRUPOS.STR.resumo],
    deducao: `O catálogo diz que, sem saldo, a operação é rejeitada ou vai para a fila “de acordo com a natureza da operação”, sem dizer qual vale para a STR0008; a fila aqui é dedução pela existência da situação 17. ${AVISO_DEBITADA}`,
  },
  {
    id: 'ted-agendada',
    title: 'TED agendada',
    summary: 'A STR0008 vai com Data e Hora de Agendamento: o STR guarda e efetiva na data.',
    grupo: 'STR',
    mensagens: ['STR0008', 'STR0008R1', 'STR0008R2'],
    situacoes: ['18', '4'],
    playLabel: 'Agendar a TED',
    okLabel: 'TED efetivada na data agendada',
    steps: [
      { from: 'IF_DEBITADA', to: 'STR', message: 'STR0008 · DtAgendt', money: true, outcome: 'espera', label: 'A IF envia a STR0008 com os campos Data Agendamento e Hora Agendamento preenchidos.' },
      { from: 'STR', to: 'IF_DEBITADA', message: 'STR0008R1 · situação 18', outcome: 'espera', label: `A R1 confirma o recebimento com a ${sit('18')}.` },
      { from: 'STR', to: 'IF_CREDITADA', message: 'STR0008R2', outcome: 'ok', money: true, label: `Na data e hora agendadas, o STR efetiva (${sit('4')}) e avisa a IF creditada.` },
    ],
    notas: [
      { texto: 'A grade AGE01, onde a STR0008 também aparece, funciona das 04:00 às 23:59:59, inclusive em sábados, feriados e domingos (a partir das 12:00). Agendamento com hora fora da grade STR01 é recusado com o ESTR0133.', fonte: 'Grade de horários do SPB (BCB); Relação de Códigos de Erros' },
      STR_SALDO,
    ],
    deducao: `A grade AGE01 ser a do agendamento é dedução pelo nome. ${AVISO_DEBITADA}`,
  },
  {
    id: 'ted-finalidade-outros',
    title: 'Rejeitada: finalidade “Outros” sem histórico',
    summary: 'A STR0008 vai com a finalidade 99999 (Outros) e sem o campo Histórico: a regra RSTR0034 não é cumprida e a mensagem volta com erro.',
    grupo: 'STR',
    mensagens: ['STR0008', 'STR0008E'],
    erro: 'ESTR0146',
    playLabel: 'Enviar a TED',
    failLabel: 'TED recusada',
    steps: [
      { from: 'IF_DEBITADA', to: 'STR', message: 'STR0008 · FinlddCli 99999', money: true, label: 'A finalidade é 99999 (“Outros”), mas o campo Histórico, que deveria descrever a finalidade, foi deixado vazio.' },
      { from: 'STR', to: 'IF_DEBITADA', message: 'STR0008E', outcome: 'erro', code: 'ESTR0146', label: `A mesma mensagem volta com o código STR0008E e o erro ESTR0146 (“${erroSpbPorCodigo('ESTR0146')?.descricao}”). Nada é debitado e a IF creditada não é avisada.` },
    ],
    notas: [
      { texto: 'RSTR0034: se o campo Finalidade for preenchido com o domínio "99999" ("Outros"), a descrição da finalidade da transferência deverá ser especificada no campo Histórico da mensagem.', fonte: 'Catálogo 5.13, Volume IV, Dicionário de Regras' },
      RETORNO_COM_ERRO,
    ],
    deducao: 'O par regra RSTR0034 ↔ erro ESTR0146 é dedução pelas descrições: o catálogo não liga cada regra a um código de erro.',
  },
  {
    id: 'ted-fora-do-horario',
    title: 'Rejeitada: fora do horário',
    summary: 'A STR0008 chega depois das 17:30 de um dia útil, quando a grade STR02 já fechou.',
    grupo: 'STR',
    mensagens: ['STR0008', 'STR0008E'],
    erro: 'ESTR0300',
    playLabel: 'Enviar a TED às 18:00',
    failLabel: 'TED recusada',
    steps: [
      { from: 'IF_DEBITADA', to: 'STR', message: 'STR0008 · 18:00', money: true, label: 'A IF envia a TED às 18:00. A grade STR02 (TED no dia) fecha às 17:30 em dias úteis.' },
      { from: 'STR', to: 'IF_DEBITADA', message: 'STR0008E', outcome: 'erro', code: 'ESTR0300', label: `A mensagem volta com erro ESTR0300 (“${erroSpbPorCodigo('ESTR0300')?.descricao}”). Para mandar depois do horário, a TED precisa ir agendada.` },
    ],
    notas: [
      { texto: 'Para erros relativos à grade horária, o provedor poderá enviar mensagens GEN0004 ou com sufixo “E”.', fonte: 'Catálogo 5.13, Volume I, Retorno de Mensagens com Erro (p. 27)' },
      { texto: 'STR0008 está na grade STR02: dias úteis das 06:30 às 17:30; 24/12 até 12:30; último dia útil do ano até 12:00.', fonte: 'Grade de horários do SPB (BCB)' },
    ],
    deducao: 'O catálogo permite as duas formas (GEN0004 ou sufixo E); a animação mostra o sufixo E com o ESTR0300.',
  },
  {
    id: 'ted-xml-mal-formado',
    title: 'Rejeitada: XML mal formado',
    summary: 'Erro de transmissão: o XML não pode nem ser lido. A resposta não é a STR0008E, e sim a GEN0004.',
    grupo: 'STR',
    mensagens: ['STR0008'],
    erro: 'EGEN0001',
    playLabel: 'Enviar a TED',
    failLabel: 'TED recusada',
    steps: [
      { from: 'IF_DEBITADA', to: 'STR', message: 'STR0008 (XML quebrado)', label: 'Uma tag ficou sem fechar: o documento não é um XML válido.' },
      { from: 'STR', to: 'IF_DEBITADA', message: 'GEN0004', outcome: 'erro', code: 'EGEN0001', label: `Erros de transmissão (XML mal formado, incompatível com o XSD, campo obrigatório ausente, erro no BCMSG) voltam na GEN0004. EGEN0001 é “${erroSpbPorCodigo('EGEN0001')?.descricao}”.` },
    ],
    notas: [RETORNO_COM_ERRO],
  },
  {
    id: 'devolucao',
    title: 'Devolução de TED (STR0010)',
    summary: 'O banco que recebeu uma TED que não consegue creditar (conta inválida) devolve o valor com a STR0010, citando a TED original.',
    grupo: 'STR',
    mensagens: ['STR0010', 'STR0010R1', 'STR0010R2'],
    situacoes: ['1'],
    playLabel: 'Devolver a TED',
    okLabel: 'Devolução efetivada',
    labels: {
      IF_DEBITADA: { title: 'Banco B', subtitle: 'recebeu a TED e devolve' },
      IF_CREDITADA: { title: 'Banco A', subtitle: 'enviou a TED' },
    },
    steps: [
      { from: 'IF_DEBITADA', to: 'STR', message: 'STR0010', money: true, code: 'Devolução 2', label: `O banco B devolve com o código de devolução 2 (“${descricaoDominio('CodDevTransf', '2')}”) e o Número Controle STR Original da TED recebida.` },
      { from: 'STR', to: ['IF_DEBITADA', 'IF_CREDITADA'], message: 'STR0010R1 + STR0010R2', outcome: 'ok', label: 'O STR liquida a devolução: R1 ao banco B, que devolveu, e R2 ao banco A, que recebe o dinheiro de volta e estorna o cliente.' },
    ],
    notas: [
      { texto: 'STR0010: destinado à IF requisitar transferência para devolução de recursos transferidos indevidamente por uma IF ou na situação em que a IF de destino não consiga acatá-los. A devolução usa a grade STR01 (dias úteis até 18:30).', fonte: 'Catálogo 5.13, Volume I (evento STR0010); Grade de horários do SPB' },
      FLUXO2,
    ],
  },
  {
    id: 'ted-sitraf',
    title: 'TED pelo SITRAF (PAG0108)',
    summary: 'A mesma TED, liquidada na câmara da Núclea em vez do STR: mensagem PAG0108, mesmo Fluxo2.',
    grupo: 'PAG',
    mensagens: ['PAG0108', 'PAG0108R1', 'PAG0108R2'],
    playLabel: 'Enviar a TED',
    okLabel: 'TED liquidada no SITRAF',
    steps: [
      { from: 'IF_DEBITADA', to: 'SITRAF', message: 'PAG0108', money: true, label: 'A IF envia a transferência entre contas de clientes para a Câmara PAG (SITRAF), com os mesmos dados da STR0008.' },
      { from: 'SITRAF', to: ['IF_DEBITADA', 'IF_CREDITADA'], message: 'PAG0108R1 + PAG0108R2', outcome: 'ok', label: 'A câmara processa considerando o saldo e os créditos recebidos de outros participantes, e responde: R1 à IF debitada e R2 à IF creditada.' },
    ],
    notas: [GRUPOS.PAG.resumo, FLUXO2],
    deducao: 'O momento exato das respostas dentro do ciclo da câmara não é detalhado no catálogo; a animação segue o Fluxo2 do evento.',
  },
];

export const cenarioTedPorId = (id: string) => CENARIOS_TED.find((c) => c.id === id);
