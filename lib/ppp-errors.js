import ppp from '../ppp.js';
import { Updates } from '../vendor/fast-element.min.js';
import { FetchError, ValidationError } from './ppp-exceptions.js';

await ppp.i18n(import.meta.url);

/**
 *
 * @param response - The response object or function.
 * @param pppMessage - Additional details message.
 */
export async function maybeFetchError(response, pppMessage) {
  let ok, res;

  if (typeof response === 'function') {
    const _ = await response();

    ok = _.ok;
    res = _.response;
  } else {
    ok = response.ok;
    res = response;
  }

  if (!ok) {
    // noinspection ExceptionCaughtLocallyJS
    throw new FetchError({
      ...res,
      ...{ message: await res.text(), pppMessage }
    });
  } else return res;
}

export function openTabOrFolding(element) {
  const folding = element?.closest('.folding');

  if (folding) {
    folding.classList.add('folding-open');
  }

  let tabPanel = element?.closest('[role="tabpanel"]');

  if (!tabPanel && element) {
    tabPanel = element.getRootNode().host?.closest('[role="tabpanel"]');
  }

  if (tabPanel) {
    const tabs = tabPanel.parentNode;

    tabs.activeid = tabPanel.getAttribute('aria-labelledby');
  }

  Updates.enqueue(() => {
    element?.scrollIntoView({ behavior: 'smooth' });
    element?.focus();
  });
}

export async function validate(element, options) {
  if (typeof options === 'undefined')
    options = {
      hook: 'required'
    };
  else if (typeof options === 'string')
    options = {
      hook: options
    };

  const value = element?.value;

  if (element) {
    element.errorMessage = void 0;
    element.appearance = 'default';
  }

  if (typeof options.hook === 'function') {
    const predicateResult = await options.hook(value);

    if (!predicateResult) {
      if (element) {
        element.errorMessage = options.errorMessage;
        element.appearance = 'error';

        openTabOrFolding(element);
      }

      throw new ValidationError({
        element,
        message: options.errorMessage
      });
    }
  } else
    switch (options.hook) {
      case 'required':
        if (
          typeof value === 'undefined' ||
          value?.toString().replace(/\s*/g, '') === ''
        ) {
          if (element) {
            element.errorMessage = ppp.t('$pppErrors.E_REQUIRED_FIELD');
            element.appearance = 'error';

            openTabOrFolding(element);
          }

          throw new ValidationError({
            element,
            message: ppp.t('$pppErrors.E_BAD_FORM')
          });
        }

        break;
    }
}

/**
 *
 * @param element
 * @param {Object} options
 * @param {boolean} options.raiseException
 * @param {boolean} options.skipScrollIntoView
 */
export function invalidate(element, options = {}) {
  const errorMessage = options.errorMessage ?? 'Неизвестная ошибка';

  if (element?.$fastController.definition.type.name === 'Toast') {
    element.appearance = 'warning';
    element.dismissible = true;

    if (!element.title) element.title = 'PPP';

    if (typeof errorMessage !== 'string') {
      element.text = errorMessage;
    } else {
      element.text = errorMessage.endsWith('.')
        ? errorMessage
        : `${errorMessage}.`;
    }

    element.removeAttribute('hidden');
  } else if (element) {
    element.errorMessage = errorMessage;
    element.appearance = 'error';

    const folding = element?.closest('.folding');

    if (folding) {
      folding.classList.add('folding-open');
    }

    if (!options.skipScrollIntoView) {
      element?.scrollIntoView({ behavior: 'smooth' });
    }

    element?.focus();
  }

  if (options.raiseException) {
    throw new ValidationError({
      message: errorMessage
    });
  }
}

export * from './ppp-exceptions.js';
