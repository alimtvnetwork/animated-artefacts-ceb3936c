import { describe, it, expect } from 'vitest';
import { checkDensity, assertDensity } from '../slides/densityCheck';

const env = {
  slideNumber: 1,
  slideName: 'demo',
  transition: 'FadeIn',
  textAnimation: 'FadeIn',
};

describe('densityCheck — Narrow Idea Per Slide', () => {
  it('returns no violations when caps are respected', () => {
    const v = checkDensity([
      {
        ...env,
        slideType: 'DataTableSlide',
        densityCheck: { capColumns: 5, capRows: 8 },
        content: { dataColumns: [{}, {}, {}], dataRows: [{}, {}] },
      },
    ]);
    expect(v).toHaveLength(0);
  });

  it('flags DataTableSlide column overflow', () => {
    const v = checkDensity([
      {
        ...env,
        slideType: 'DataTableSlide',
        densityCheck: { capColumns: 3 },
        content: { dataColumns: [{}, {}, {}, {}], dataRows: [] },
      },
    ]);
    expect(v).toHaveLength(1);
    expect(v[0].field).toBe('capColumns');
    expect(v[0].actual).toBe(4);
    expect(v[0].cap).toBe(3);
  });

  it('flags DatabaseDiagramSlide entities overflow', () => {
    const v = checkDensity([
      {
        ...env,
        slideType: 'DatabaseDiagramSlide',
        densityCheck: { capEntities: 3 },
        content: { dbEntities: [{}, {}, {}, {}, {}] },
      },
    ]);
    expect(v[0]?.field).toBe('capEntities');
    expect(v[0]?.actual).toBe(5);
  });

  it('skips slides without densityCheck', () => {
    const v = checkDensity([{ ...env, slideType: 'TitleSlide', content: { title: 'Hi' } }]);
    expect(v).toHaveLength(0);
  });

  it('assertDensity throws naming each violation', () => {
    expect(() =>
      assertDensity([
        {
          ...env,
          slideName: 'too-wide',
          slideType: 'DataTableSlide',
          densityCheck: { capColumns: 2 },
          content: { dataColumns: [{}, {}, {}] },
        },
      ]),
    ).toThrow(/too-wide.*capColumns: 3 > cap 2/s);
  });

  it('counts NumberCalloutSlide.number as a single number', () => {
    const v = checkDensity([
      {
        ...env,
        slideType: 'NumberCalloutSlide',
        densityCheck: { capNumbers: 1 },
        content: { number: { to: 92 } },
      },
    ]);
    expect(v).toHaveLength(0);
  });
});
