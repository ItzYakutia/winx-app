import { HttpErrorResponse } from '@angular/common/http';

export function authError(error: unknown, action: 'login' | 'register'): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0)
      return 'Нет связи с сервером. Проверьте подключение и попробуйте ещё раз.';
    if (error.status === 429) return 'Слишком много попыток. Попробуйте немного позже.';
    if (action === 'login' && [401, 404].includes(error.status))
      return 'Неверная почта или пароль.';
    if (action === 'register' && error.status === 409)
      return 'Эта почта уже зарегистрирована. Войдите в аккаунт.';
    if ([400, 422].includes(error.status))
      return 'Проверьте почту и пароль. Пароль — от 8 символов.';
    if (error.status >= 500) return 'Сервер временно недоступен. Попробуйте ещё раз.';
  }
  return (
    'Не удалось ' + (action === 'login' ? 'войти' : 'создать аккаунт') + '. Попробуйте ещё раз.'
  );
}
