import i18n from '../index';

describe('i18n', () => {
  beforeEach(() => {
    // Reset to default language before each test
    i18n.changeLanguage('en');
  });

  describe('Onboarding translations', () => {
    it('should have onboarding.welcome in English', () => {
      expect(i18n.t('onboarding.welcome')).toBe('Welcome to FODMAP Easy');
    });

    it('should have onboarding.welcome in Portuguese', async () => {
      await i18n.changeLanguage('pt');
      expect(i18n.t('onboarding.welcome')).toBe('Bem-vindo ao FODMAP Fácil');
    });

    it('should have onboarding.getStarted in English', () => {
      expect(i18n.t('onboarding.getStarted')).toBe('Get Started');
    });

    it('should have onboarding.getStarted in Portuguese', async () => {
      await i18n.changeLanguage('pt');
      expect(i18n.t('onboarding.getStarted')).toBe('Começar');
    });

    it('should have onboarding.features.title in both languages', async () => {
      expect(i18n.t('onboarding.features.title')).toBe('Features');

      await i18n.changeLanguage('pt');
      expect(i18n.t('onboarding.features.title')).toBe('Recursos');
    });
  });

  describe('Tab navigation translations', () => {
    it('should have all tab labels in English', () => {
      expect(i18n.t('tabs.home')).toBe('Home');
      expect(i18n.t('tabs.journey')).toBe('Journey');
      expect(i18n.t('tabs.diary')).toBe('Diary');
      expect(i18n.t('tabs.reports')).toBe('Reports');
      expect(i18n.t('tabs.profile')).toBe('Profile');
    });

    it('should have all tab labels in Portuguese', async () => {
      await i18n.changeLanguage('pt');
      expect(i18n.t('tabs.home')).toBe('Início');
      expect(i18n.t('tabs.journey')).toBe('Jornada');
      expect(i18n.t('tabs.diary')).toBe('Diário');
      expect(i18n.t('tabs.reports')).toBe('Relatórios');
      expect(i18n.t('tabs.profile')).toBe('Perfil');
    });
  });

  describe('Common action labels', () => {
    it('should have common action labels in English', () => {
      expect(i18n.t('common.save')).toBe('Save');
      expect(i18n.t('common.cancel')).toBe('Cancel');
      expect(i18n.t('common.delete')).toBe('Delete');
      expect(i18n.t('common.edit')).toBe('Edit');
    });

    it('should have common action labels in Portuguese', async () => {
      await i18n.changeLanguage('pt');
      expect(i18n.t('common.save')).toBe('Salvar');
      expect(i18n.t('common.cancel')).toBe('Cancelar');
      expect(i18n.t('common.delete')).toBe('Excluir');
      expect(i18n.t('common.edit')).toBe('Editar');
    });
  });

  describe('Language switching', () => {
    it('should switch from English to Portuguese', async () => {
      expect(i18n.language).toBe('en');
      expect(i18n.t('common.appName')).toBe('FODMAP Reintroduction');

      await i18n.changeLanguage('pt');
      expect(i18n.language).toBe('pt');
      expect(i18n.t('common.appName')).toBe('Reintrodução FODMAP');
    });

    it('should switch from Portuguese to English', async () => {
      await i18n.changeLanguage('pt');
      expect(i18n.language).toBe('pt');
      expect(i18n.t('tabs.home')).toBe('Início');

      await i18n.changeLanguage('en');
      expect(i18n.language).toBe('en');
      expect(i18n.t('tabs.home')).toBe('Home');
    });
  });
});
