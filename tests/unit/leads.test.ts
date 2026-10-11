import { describe, expect, it } from 'vitest';
import { filtrarLeads, leadsParaCsv, validarLead, type LeadRow } from '@/lib/leads';

const news = { tipo: 'newsletter', email: '  Ana@Exemplo.com.br ', perfil: 'qa', consentimento: true };
const contato = { tipo: 'contato', nome: 'Ana', email: 'ana@ex.com', empresa: '', mensagem: 'Preciso homologar o Pix até março.', consentimento: true };

describe('validarLead', () => {
  it('newsletter válida: e-mail normalizado, origem anexada', () => {
    expect(validarLead(news, 'inicio')).toEqual({ ok: true, doc: { tipo: 'newsletter', email: 'ana@exemplo.com.br', perfil: 'qa', consentimento: true, origem: 'inicio' } });
  });

  it('contato válido: campo opcional vazio fica de fora e sem origem não grava origem', () => {
    const r = validarLead(contato);
    expect(r).toEqual({ ok: true, doc: { tipo: 'contato', nome: 'Ana', email: 'ana@ex.com', mensagem: 'Preciso homologar o Pix até março.', consentimento: true } });
  });

  it('sem consentimento não entra (LGPD)', () => {
    const r = validarLead({ ...news, consentimento: false });
    expect(r).toMatchObject({ ok: false, erros: { consentimento: 'Marque a caixa para concordar' } });
  });

  it.each([
    ['sem @', 'ana.exemplo.com'],
    ['sem domínio', 'ana@'],
    ['com espaço no meio', 'a na@ex.com'],
    ['longo demais', `${'a'.repeat(250)}@ex.com`],
  ])('e-mail inválido (%s)', (_, email) => {
    expect(validarLead({ ...news, email })).toMatchObject({ ok: false, erros: { email: expect.any(String) } });
  });

  it('perfil fora da lista é recusado; contato exige nome e mensagem com tamanho mínimo', () => {
    expect(validarLead({ ...news, perfil: 'ceo' })).toMatchObject({ ok: false, erros: { perfil: 'Escolha o seu perfil' } });
    expect(validarLead({ ...contato, nome: 'A', mensagem: 'oi' })).toMatchObject({ ok: false, erros: { nome: 'Informe seu nome', mensagem: expect.any(String) } });
  });

  it('valor-limite: mensagem com 2000 caracteres entra, com 2001 não', () => {
    expect(validarLead({ ...contato, mensagem: 'x'.repeat(2000) }).ok).toBe(true);
    expect(validarLead({ ...contato, mensagem: 'x'.repeat(2001) })).toMatchObject({ ok: false, erros: { mensagem: 'Até 2000 caracteres' } });
  });

  it('campo-isca preenchido: descarta como robô; vazio é ignorado', () => {
    expect(validarLead({ ...news, site: 'http://spam' })).toEqual({ ok: false, erros: {}, robo: true });
    expect(validarLead({ ...news, site: '' }).ok).toBe(true);
  });

  it('tipo desconhecido e campos extras não passam para o banco', () => {
    expect(validarLead({ ...news, tipo: 'outro' }).ok).toBe(false);
    const r = validarLead({ ...news, admin: true }, 'x'.repeat(300));
    expect(r.ok && Object.keys(r.doc)).toEqual(['tipo', 'email', 'perfil', 'consentimento', 'origem']);
    expect(r.ok && r.doc.origem).toHaveLength(200);
  });
});

const rows: LeadRow[] = [
  { id: '1', tipo: 'newsletter', email: 'ana@ex.com', perfil: 'qa', criadoEm: new Date('2026-10-11T12:00:00Z') },
  { id: '2', tipo: 'contato', email: 'bia@banco.com', nome: 'Bia; "Souza"', empresa: 'Banco X', mensagem: 'linha 1\nlinha 2' },
  { id: '3', tipo: 'contato', email: 'evil@ex.com', nome: '=HYPERLINK("http://x")', mensagem: '+cmd' },
];

describe('painel: filtro e CSV', () => {
  it('filtra por tipo, perfil e texto (sem diferenciar maiúsculas)', () => {
    expect(filtrarLeads(rows, {}).map((r) => r.id)).toEqual(['1', '2', '3']);
    expect(filtrarLeads(rows, { tipo: 'contato' }).map((r) => r.id)).toEqual(['2', '3']);
    expect(filtrarLeads(rows, { tipo: 'todos', perfil: 'qa' }).map((r) => r.id)).toEqual(['1']);
    expect(filtrarLeads(rows, { perfil: 'todos', texto: ' BANCO x ' }).map((r) => r.id)).toEqual(['2']);
  });

  it('CSV com ";", BOM, aspas escapadas e quebra de linha dentro da célula', () => {
    const csv = leadsParaCsv(rows);
    expect(csv.startsWith('﻿criadoEm;tipo;nome;email;perfil;empresa;mensagem;origem\r\n')).toBe(true);
    expect(csv).toContain('2026-10-11T12:00:00.000Z;newsletter;;ana@ex.com;qa;;;');
    expect(csv).toContain(';contato;"Bia; ""Souza""";bia@banco.com;;Banco X;"linha 1\nlinha 2";');
  });

  it('CSV neutraliza fórmulas de planilha (injeção de CSV)', () => {
    const linha = leadsParaCsv([rows[2]]).split('\r\n')[1];
    expect(linha).toBe(';contato;"\'=HYPERLINK(""http://x"")";evil@ex.com;;;"\'+cmd";');
  });
});
