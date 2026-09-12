import '../../test/setup';
import { afterEach, describe, expect, it, mock } from 'bun:test';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { DateTimeInput } from '@rin/ui';

const labels = { select: '选择日期与时间', previous: '上个月', next: '下个月', clear: '清除', done: '完成', hours: '小时', minutes: '分钟' };
afterEach(cleanup);

describe('Admin date input', () => {
  it('localizes the calendar without changing the selected date, and returns focus on Escape', () => {
    const onChange = mock();
    const view = render(<DateTimeInput value={new Date(2026, 8, 12, 9, 30)} onChange={onChange} locale="zh-CN" labels={labels} />);
    const trigger = view.getByRole('button', { name: /2026-09-12/ });
    fireEvent.click(trigger);
    expect(view.getByText('2026年9月')).toBeTruthy();
    const next = view.getByRole('button', { name: labels.next });
    next.focus();
    fireEvent.click(next);
    expect(view.getByText('2026年10月')).toBeTruthy();
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.keyDown(next, { key: 'Escape' });
    expect(view.queryByRole('button', { name: labels.next })).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
  it('preserves the time when selecting a day and supports clearing', () => {
    const onChange = mock();
    const view = render(<DateTimeInput value={new Date(2026, 8, 12, 9, 30)} onChange={onChange} locale="zh-CN" labels={labels} />);
    fireEvent.click(view.getByRole('button', { name: /2026-09-12/ }));
    fireEvent.click(view.getByRole('button', { name: /^15$/ }));
    expect(onChange.mock.calls[0][0]).toEqual(new Date(2026, 8, 15, 9, 30));
    expect((view.getByRole('spinbutton', { name: labels.hours }) as HTMLInputElement).value).toBe('09');
    fireEvent.click(view.getByRole('button', { name: labels.clear }));
    expect(onChange.mock.calls[1][0]).toBeUndefined();
  });
});
