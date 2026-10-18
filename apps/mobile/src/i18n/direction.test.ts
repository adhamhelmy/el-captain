import { I18nManager } from 'react-native';
import { syncDirection } from './direction';

describe('syncDirection', () => {
  const reload = jest.fn();
  beforeEach(() => {
    reload.mockReset();
    jest.spyOn(I18nManager, 'forceRTL').mockImplementation(() => {});
    jest.spyOn(I18nManager, 'allowRTL').mockImplementation(() => {});
  });

  it('mirrors the layout for Arabic and reloads once to apply it', () => {
    expect(syncDirection('ar', false, reload)).toBe(true);
    expect(I18nManager.forceRTL).toHaveBeenCalledWith(true);
    expect(reload).toHaveBeenCalled();
  });

  it('un-mirrors English on a right-to-left device (e.g. Hebrew)', () => {
    expect(syncDirection('en', true, reload)).toBe(true);
    expect(I18nManager.forceRTL).toHaveBeenCalledWith(false);
  });

  it('reloads at most once for the same language, so a direction that will not stick cannot loop', () => {
    expect(syncDirection('ar', false, reload, 'ar')).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it('does nothing when text and layout already agree', () => {
    expect(syncDirection('ar', true, reload)).toBe(false);
    expect(syncDirection('en', false, reload)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});
