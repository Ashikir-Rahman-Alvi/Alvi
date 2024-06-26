/** @license React v17.0.2
 * react-dom.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react')) :
  typeof define === 'function' && define.amd ? define(['exports', 'react'], factory) :
  (global = global || self, factory(global.ReactDOM = {}, global.React));
}(this, (function (exports, React) { 'use strict';

  var ReactSharedInternals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

  // by calls to these methods by a Babel plugin.
  //
  // In PROD (or in packages without access to React internals),
  // they are left as they are instead.

  function warn(format) {
    {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      printWarning('warn', format, args);
    }
  }
  function error(format) {
    {
      for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }

      printWarning('error', format, args);
    }
  }

  function printWarning(level, format, args) {
    // When changing this logic, you might want to also
    // update consoleWithStackDev.www.js as well.
    {
      var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
      var stack = ReactDebugCurrentFrame.getStackAddendum();

      if (stack !== '') {
        format += '%s';
        args = args.concat([stack]);
      }

      var argsWithFormat = args.map(function (item) {
        return '' + item;
      }); // Careful: RN currently depends on this prefix

      argsWithFormat.unshift('Warning: ' + format); // We intentionally don't use spread (or .apply) directly because it
      // breaks IE9: https://github.com/facebook/react/issues/13610
      // eslint-disable-next-line react-internal/no-production-logging

      Function.prototype.apply.call(console[level], console, argsWithFormat);
    }
  }

  if (!React) {
    {
      throw Error( "ReactDOM was loaded before React. Make sure you load the React package before loading ReactDOM." );
    }
  }

  var FunctionComponent = 0;
  var ClassComponent = 1;
  var IndeterminateComponent = 2; // Before we know whether it is function or class

  var HostRoot = 3; // Root of a host tree. Could be nested inside another node.

  var HostPortal = 4; // A subtree. Could be an entry point to a different renderer.

  var HostComponent = 5;
  var HostText = 6;
  var Fragment = 7;
  var Mode = 8;
  var ContextConsumer = 9;
  var ContextProvider = 10;
  var ForwardRef = 11;
  var Profiler = 12;
  var SuspenseComponent = 13;
  var MemoComponent = 14;
  var SimpleMemoComponent = 15;
  var LazyComponent = 16;
  var IncompleteClassComponent = 17;
  var DehydratedFragment = 18;
  var SuspenseListComponent = 19;
  var FundamentalComponent = 20;
  var ScopeComponent = 21;
  var Block = 22;
  var OffscreenComponent = 23;
  var LegacyHiddenComponent = 24;

  // Filter certain DOM attributes (e.g. src, href) if their values are empty strings.

  var enableProfilerTimer = true; // Record durations for commit and passive effects phases.

  var enableFundamentalAPI = false; // Experimental Scope support.
  var enableNewReconciler = false; // Errors that are thrown while unmounting (or after in the case of passive effects)
  var warnAboutStringRefs = false;

  var allNativeEvents = new Set();
  /**
   * Mapping from registration name to event name
   */


  var registrationNameDependencies = {};
  /**
   * Mapping from lowercase registration names to the properly cased version,
   * used to warn in the case of missing event handlers. Available
   * only in true.
   * @type {Object}
   */

  var possibleRegistrationNames =  {} ; // Trust the developer to only use possibleRegistrationNames in true

  function registerTwoPhaseEvent(registrationName, dependencies) {
    registerDirectEvent(registrationName, dependencies);
    registerDirectEvent(registrationName + 'Capture', dependencies);
  }
  function registerDirectEvent(registrationName, dependencies) {
    {
      if (registrationNameDependencies[registrationName]) {
        error('EventRegistry: More than one plugin attempted to publish the same ' + 'registration name, `%s`.', registrationName);
      }
    }

    registrationNameDependencies[registrationName] = dependencies;

    {
      var lowerCasedName = registrationName.toLowerCase();
      possibleRegistrationNames[lowerCasedName] = registrationName;

      if (registrationName === 'onDoubleClick') {
        possibleRegistrationNames.ondblclick = registrationName;
      }
    }

    for (var i = 0; i < dependencies.length; i++) {
      allNativeEvents.add(dependencies[i]);
    }
  }

  var canUseDOM = !!(typeof window !== 'undefined' && typeof window.document !== 'undefined' && typeof window.document.createElement !== 'undefined');

  // A reserved attribute.
  // It is handled by React separately and shouldn't be written to the DOM.
  var RESERVED = 0; // A simple string attribute.
  // Attributes that aren't in the filter are presumed to have this type.

  var STRING = 1; // A string attribute that accepts booleans in React. In HTML, these are called
  // "enumerated" attributes with "true" and "false" as possible values.
  // When true, it should be set to a "true" string.
  // When false, it should be set to a "false" string.

  var BOOLEANISH_STRING = 2; // A real boolean attribute.
  // When true, it should be present (set either to an empty string or its name).
  // When false, it should be omitted.

  var BOOLEAN = 3; // An attribute that can be used as a flag as well as with a value.
  // When true, it should be present (set either to an empty string or its name).
  // When false, it should be omitted.
  // For any other value, should be present with that value.

  var OVERLOADED_BOOLEAN = 4; // An attribute that must be numeric or parse as a numeric.
  // When falsy, it should be removed.

  var NUMERIC = 5; // An attribute that must be positive numeric or parse as a positive numeric.
  // When falsy, it should be removed.

  var POSITIVE_NUMERIC = 6;

  /* eslint-disable max-len */
  var ATTRIBUTE_NAME_START_CHAR = ":A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
  /* eslint-enable max-len */

  var ATTRIBUTE_NAME_CHAR = ATTRIBUTE_NAME_START_CHAR + "\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040";
  var ROOT_ATTRIBUTE_NAME = 'data-reactroot';
  var VALID_ATTRIBUTE_NAME_REGEX = new RegExp('^[' + ATTRIBUTE_NAME_START_CHAR + '][' + ATTRIBUTE_NAME_CHAR + ']*$');
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var illegalAttributeNameCache = {};
  var validatedAttributeNameCache = {};
  function isAttributeNameSafe(attributeName) {
    if (hasOwnProperty.call(validatedAttributeNameCache, attributeName)) {
      return true;
    }

    if (hasOwnProperty.call(illegalAttributeNameCache, attributeName)) {
      return false;
    }

    if (VALID_ATTRIBUTE_NAME_REGEX.test(attributeName)) {
      validatedAttributeNameCache[attributeName] = true;
      return true;
    }

    illegalAttributeNameCache[attributeName] = true;

    {
      error('Invalid attribute name: `%s`', attributeName);
    }

    return false;
  }
  function shouldIgnoreAttribute(name, propertyInfo, isCustomComponentTag) {
    if (propertyInfo !== null) {
      return propertyInfo.type === RESERVED;
    }

    if (isCustomComponentTag) {
      return false;
    }

    if (name.length > 2 && (name[0] === 'o' || name[0] === 'O') && (name[1] === 'n' || name[1] === 'N')) {
      return true;
    }

    return false;
  }
  function shouldRemoveAttributeWithWarning(name, value, propertyInfo, isCustomComponentTag) {
    if (propertyInfo !== null && propertyInfo.type === RESERVED) {
      return false;
    }

    switch (typeof value) {
      case 'function': // $FlowIssue symbol is perfectly valid here

      case 'symbol':
        // eslint-disable-line
        return true;

      case 'boolean':
        {
          if (isCustomComponentTag) {
            return false;
          }

          if (propertyInfo !== null) {
            return !propertyInfo.acceptsBooleans;
          } else {
            var prefix = name.toLowerCase().slice(0, 5);
            return prefix !== 'data-' && prefix !== 'aria-';
          }
        }

      default:
        return false;
    }
  }
  function shouldRemoveAttribute(name, value, propertyInfo, isCustomComponentTag) {
    if (value === null || typeof value === 'undefined') {
      return true;
    }

    if (shouldRemoveAttributeWithWarning(name, value, propertyInfo, isCustomComponentTag)) {
      return true;
    }

    if (isCustomComponentTag) {
      return false;
    }

    if (propertyInfo !== null) {

      switch (propertyInfo.type) {
        case BOOLEAN:
          return !value;

        case OVERLOADED_BOOLEAN:
          return value === false;

        case NUMERIC:
          return isNaN(value);

        case POSITIVE_NUMERIC:
          return isNaN(value) || value < 1;
      }
    }

    return false;
  }
  function getPropertyInfo(name) {
    return properties.hasOwnProperty(name) ? properties[name] : null;
  }

  function PropertyInfoRecord(name, type, mustUseProperty, attributeName, attributeNamespace, sanitizeURL, removeEmptyString) {
    this.acceptsBooleans = type === BOOLEANISH_STRING || type === BOOLEAN || type === OVERLOADED_BOOLEAN;
    this.attributeName = attributeName;
    this.attributeNamespace = attributeNamespace;
    this.mustUseProperty = mustUseProperty;
    this.propertyName = name;
    this.type = type;
    this.sanitizeURL = sanitizeURL;
    this.removeEmptyString = removeEmptyString;
  } // When adding attributes to this list, be sure to also add them to
  // the `possibleStandardNames` module to ensure casing and incorrect
  // name warnings.


  var properties = {}; // These props are reserved by React. They shouldn't be written to the DOM.

  var reservedProps = ['children', 'dangerouslySetInnerHTML', // TODO: This prevents the assignment of defaultValue to regular
  // elements (not just inputs). Now that ReactDOMInput assigns to the
  // defaultValue property -- do we need this?
  'defaultValue', 'defaultChecked', 'innerHTML', 'suppressContentEditableWarning', 'suppressHydrationWarning', 'style'];
  reservedProps.forEach(function (name) {
    properties[name] = new PropertyInfoRecord(name, RESERVED, false, // mustUseProperty
    name, // attributeName
    null, // attributeNamespace
    false, // sanitizeURL
    false);
  }); // A few React string attributes have a different name.
  // This is a mapping from React prop names to the attribute names.

  [['acceptCharset', 'accept-charset'], ['className', 'class'], ['htmlFor', 'for'], ['httpEquiv', 'http-equiv']].forEach(function (_ref) {
    var name = _ref[0],
        attributeName = _ref[1];
    properties[name] = new PropertyInfoRecord(name, STRING, false, // mustUseProperty
    attributeName, // attributeName
    null, // attributeNamespace
    false, // sanitizeURL
    false);
  }); // These are "enumerated" HTML attributes that accept "true" and "false".
  // In React, we let users pass `true` and `false` even though technically
  // these aren't boolean attributes (they are coerced to strings).

  ['contentEditable', 'draggable', 'spellCheck', 'value'].forEach(function (name) {
    properties[name] = new PropertyInfoRecord(name, BOOLEANISH_STRING, false, // mustUseProperty
    name.toLowerCase(), // attributeName
    null, // attributeNamespace
    false, // sanitizeURL
    false);
  }); // These are "enumerated" SVG attributes that accept "true" and "false".
  // In React, we let users pass `true` and `false` even though technically
  // these aren't boolean attributes (they are coerced to strings).
  // Since these are SVG attributes, their attribute names are case-sensitive.

  ['autoReverse', 'externalResourcesRequired', 'focusable', 'preserveAlpha'].forEach(function (name) {
    properties[name] = new PropertyInfoRecord(name, BOOLEANISH_STRING, false, // mustUseProperty
    name, // attributeName
    null, // attributeNamespace
    false, // sanitizeURL
    false);
  }); // These are HTML boolean attributes.

  ['allowFullScreen', 'async', // Note: there is a special case that prevents it from being written to the DOM
  // on the client side because the browsers are inconsistent. Instead we call focus().
  'autoFocus', 'autoPlay', 'controls', 'default', 'defer', 'disabled', 'disablePictureInPicture', 'disableRemotePlayback', 'formNoValidate', 'hidden', 'loop', 'noModule', 'noValidate', 'open', 'playsInline', 'readOnly', 'required', 'reversed', 'scoped', 'seamless', // Microdata
  'itemScope'].forEach(function (name) {
    properties[name] = new PropertyInfoRecord(name, BOOLEAN, false, // mustUseProperty
    name.toLowerCase(), // attributeName
    null, // attributeNamespace
    false, // sanitizeURL
    false);
  }); // These are the few React props that we set as DOM properties
  // rather than attributes. These are all booleans.

  ['checked', // Note: `option.selected` is not updated if `select.multiple` is
  // disabled with `removeAttribute`. We have special logic for handling this.
  'multiple', 'muted', 'selected' // NOTE: if you add a camelCased prop to this list,
  // you'll need to set attributeName to name.toLowerCase()
  // instead in the assignment below.
  ].forEach(function (name) {
    properties[name] = new PropertyInfoRecord(name, BOOLEAN, true, // mustUseProperty
    name, // attributeName
    null, // attributeNamespace
    false, // sanitizeURL
    false);
  }); // These are HTML attributes that are "overloaded booleans": they behave like
  // booleans, but can also accept a string value.

  ['capture', 'download' // NOTE: if you add a camelCased prop to this list,
  // you'll need to set attributeName to name.toLowerCase()
  // instead in the assignment below.
  ].forEach(function (name) {
    properties[name] = new PropertyInfoRecord(name, OVERLOADED_BOOLEAN, false, // mustUseProperty
    name, // attributeName
    null, // attributeNamespace
    false, // sanitizeURL
    false);
  }); // These are HTML attributes that must be positive numbers.

  ['cols', 'rows', 'size', 'span' // NOTE: if you add a camelCased prop to this list,
  // you'll need to set attributeName to name.toLowerCase()
  // instead in the assignment below.
  ].forEach(function (name) {
    properties[name] = new PropertyInfoRecord(name, POSITIVE_NUMERIC, false, // mustUseProperty
    name, // attributeName
    null, // attributeNamespace
    false, // sanitizeURL
    false);
  }); // These are HTML attributes that must be numbers.

  ['rowSpan', 'start'].forEach(function (name) {
    properties[name] = new PropertyInfoRecord(name, NUMERIC, false, // mustUseProperty
    name.toLowerCase(), // attributeName
    null, // attributeNamespace
    false, // sanitizeURL
    false);
  });
  var CAMELIZE = /[\-\:]([a-z])/g;

  var capitalize = function (token) {
    return token[1].toUpperCase();
  }; // This is a list of all SVG attributes that need special casing, namespacing,
  // or boolean value assignment. Regular attributes that just accept strings
  // and have the same names are omitted, just like in the HTML attribute filter.
  // Some of these attributes can be hard to find. This list was created by
  // scraping the MDN documentation.


  ['accent-height', 'alignment-baseline', 'arabic-form', 'baseline-shift', 'cap-height', 'clip-path', 'clip-rule', 'color-interpolation', 'color-interpolation-filters', 'color-profile', 'color-rendering', 'dominant-baseline', 'enable-background', 'fill-opacity', 'fill-rule', 'flood-color', 'flood-opacity', 'font-family', 'font-size', 'font-size-adjust', 'font-stretch', 'font-style', 'font-variant', 'font-weight', 'glyph-name', 'glyph-orientation-horizontal', 'glyph-orientation-vertical', 'horiz-adv-x', 'horiz-origin-x', 'image-rendering', 'letter-spacing', 'lighting-color', 'marker-end', 'marker-mid', 'marker-start', 'overline-position', 'overline-thickness', 'paint-order', 'panose-1', 'pointer-events', 'rendering-intent', 'shape-rendering', 'stop-color', 'stop-opacity', 'strikethrough-position', 'strikethrough-thickness', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-opacity', 'stroke-width', 'text-anchor', 'text-decoration', 'text-rendering', 'underline-position', 'underline-thickness', 'unicode-bidi', 'unicode-range', 'units-per-em', 'v-alphabetic', 'v-hanging', 'v-ideographic', 'v-mathematical', 'vector-effect', 'vert-adv-y', 'vert-origin-x', 'vert-origin-y', 'word-spacing', 'writing-mode', 'xmlns:xlink', 'x-height' // NOTE: if you add a camelCased prop to this list,
  // you'll need to set attributeName to name.toLowerCase()
  // instead in the assignment below.
  ].forEach(function (attributeName) {
    var name = attributeName.replace(CAMELIZE, capitalize);
    properties[name] = new PropertyInfoRecord(name, STRING, false, // mustUseProperty
    attributeName, null, // attributeNamespace
    false, // sanitizeURL
    false);
  }); // String SVG attributes with the xlink namespace.

  ['xlink:actuate', 'xlink:arcrole', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type' // NOTE: if you add a camelCased prop to this list,
  // you'll need to set attributeName to name.toLowerCase()
  // instead in the assignment below.
  ].forEach(function (attributeName) {
    var name = attributeName.replace(CAMELIZE, capitalize);
    properties[name] = new PropertyInfoRecord(name, STRING, false, // mustUseProperty
    attributeName, 'http://www.w3.org/1999/xlink', false, // sanitizeURL
    false);
  }); // String SVG attributes with the xml namespace.

  ['xml:base', 'xml:lang', 'xml:space' // NOTE: if you add a camelCased prop to this list,
  // you'll need to set attributeName to name.toLowerCase()
  // instead in the assignment below.
  ].forEach(function (attributeName) {
    var name = attributeName.replace(CAMELIZE, capitalize);
    properties[name] = new PropertyInfoRecord(name, STRING, false, // mustUseProperty
    attributeName, 'http://www.w3.org/XML/1998/namespace', false, // sanitizeURL
    false);
  }); // These attribute exists both in HTML and SVG.
  // The attribute name is case-sensitive in SVG so we can't just use
  // the React name like we do for attributes that exist only in HTML.

  ['tabIndex', 'crossOrigin'].forEach(function (attributeName) {
    properties[attributeName] = new PropertyInfoRecord(attributeName, STRING, false, // mustUseProperty
    attributeName.toLowerCase(), // attributeName
    null, // attributeNamespace
    false, // sanitizeURL
    false);
  }); // These attributes accept URLs. These must not allow javascript: URLS.
  // These will also need to accept Trusted Types object in the future.

  var xlinkHref = 'xlinkHref';
  properties[xlinkHref] = new PropertyInfoRecord('xlinkHref', STRING, false, // mustUseProperty
  'xlink:href', 'http://www.w3.org/1999/xlink', true, // sanitizeURL
  false);
  ['src', 'href', 'action', 'formAction'].forEach(function (attributeName) {
    properties[attributeName] = new PropertyInfoRecord(attributeName, STRING, false, // mustUseProperty
    attributeName.toLowerCase(), // attributeName
    null, // attributeNamespace
    true, // sanitizeURL
    true);
  });

  // and any newline or tab are filtered out as if they're not part of the URL.
  // https://url.spec.whatwg.org/#url-parsing
  // Tab or newline are defined as \r\n\t:
  // https://infra.spec.whatwg.org/#ascii-tab-or-newline
  // A C0 control is a code point in the range \u0000 NULL to \u001F
  // INFORMATION SEPARATOR ONE, inclusive:
  // https://infra.spec.whatwg.org/#c0-control-or-space

  /* eslint-disable max-len */

  var isJavaScriptProtocol = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*\:/i;
  var didWarn = false;

  function sanitizeURL(url) {
    {
      if (!didWarn && isJavaScriptProtocol.test(url)) {
        didWarn = true;

        error('A future version of React will block javascript: URLs as a security precaution. ' + 'Use event handlers instead if you can. If you need to generate unsafe HTML try ' + 'using dangerouslySetInnerHTML instead. React was passed %s.', JSON.stringify(url));
      }
    }
  }

  /**
   * Get the value for a property on a node. Only used in DEV for SSR validation.
   * The "expected" argument is used as a hint of what the expected value is.
   * Some properties have multiple equivalent values.
   */
  function getValueForProperty(node, name, expected, propertyInfo) {
    {
      if (propertyInfo.mustUseProperty) {
        var propertyName = propertyInfo.propertyName;
        return node[propertyName];
      } else {
        if ( propertyInfo.sanitizeURL) {
          // If we haven't fully disabled javascript: URLs, and if
          // the hydration is successful of a javascript: URL, we
          // still want to warn on the client.
          sanitizeURL('' + expected);
        }

        var attributeName = propertyInfo.attributeName;
        var stringValue = null;

        if (propertyInfo.type === OVERLOADED_BOOLEAN) {
          if (node.hasAttribute(attributeName)) {
            var value = node.getAttribute(attributeName);

            if (value === '') {
              return true;
            }

            if (shouldRemoveAttribute(name, expected, propertyInfo, false)) {
              return value;
            }

            if (value === '' + expected) {
              return expected;
            }

            return value;
          }
        } else if (node.hasAttribute(attributeName)) {
          if (shouldRemoveAttribute(name, expected, propertyInfo, false)) {
            // We had an attribute but shouldn't have had one, so read it
            // for the error message.
            return node.getAttribute(attributeName);
          }

          if (propertyInfo.type === BOOLEAN) {
            // If this was a boolean, it doesn't matter what the value is
            // the fact that we have it is the same as the expected.
            return expected;
          } // Even if this property uses a namespace we use getAttribute
          // because we assume its namespaced name is the same as our config.
          // To use getAttributeNS we need the local name which we don't have
          // in our config atm.


          stringValue = node.getAttribute(attributeName);
        }

        if (shouldRemoveAttribute(name, expected, propertyInfo, false)) {
          return stringValue === null ? expected : stringValue;
        } else if (stringValue === '' + expected) {
          return expected;
        } else {
          return stringValue;
        }
      }
    }
  }
  /**
   * Get the value for a attribute on a node. Only used in DEV for SSR validation.
   * The third argument is used as a hint of what the expected value is. Some
   * attributes have multiple equivalent values.
   */

  function getValueForAttribute(node, name, expected) {
    {
      if (!isAttributeNameSafe(name)) {
        return;
      } // If the object is an opaque reference ID, it's expected that
      // the next prop is different than the server value, so just return
      // expected


      if (isOpaqueHydratingObject(expected)) {
        return expected;
      }

      if (!node.hasAttribute(name)) {
        return expected === undefined ? undefined : null;
      }

      var value = node.getAttribute(name);

      if (value === '' + expected) {
        return expected;
      }

      return value;
    }
  }
  /**
   * Sets the value for a property on a node.
   *
   * @param {DOMElement} node
   * @param {string} name
   * @param {*} value
   */

  function setValueForProperty(node, name, value, isCustomComponentTag) {
    var propertyInfo = getPropertyInfo(name);

    if (shouldIgnoreAttribute(name, propertyInfo, isCustomComponentTag)) {
      return;
    }

    if (shouldRemoveAttribute(name, value, propertyInfo, isCustomComponentTag)) {
      value = null;
    } // If the prop isn't in the special list, treat it as a simple attribute.


    if (isCustomComponentTag || propertyInfo === null) {
      if (isAttributeNameSafe(name)) {
        var _attributeName = name;

        if (value === null) {
          node.removeAttribute(_attributeName);
        } else {
          node.setAttribute(_attributeName,  '' + value);
        }
      }

      return;
    }

    var mustUseProperty = propertyInfo.mustUseProperty;

    if (mustUseProperty) {
      var propertyName = propertyInfo.propertyName;

      if (value === null) {
        var type = propertyInfo.type;
        node[propertyName] = type === BOOLEAN ? false : '';
      } else {
        // Contrary to `setAttribute`, object properties are properly
        // `toString`ed by IE8/9.
        node[propertyName] = value;
      }

      return;
    } // The rest are treated as attributes with special cases.


    var attributeName = propertyInfo.attributeName,
        attributeNamespace = propertyInfo.attributeNamespace;

    if (value === null) {
      node.removeAttribute(attributeName);
    } else {
      var _type = propertyInfo.type;
      var attributeValue;

      if (_type === BOOLEAN || _type === OVERLOADED_BOOLEAN && value === true) {
        // If attribute type is boolean, we know for sure it won't be an execution sink
        // and we won't require Trusted Type here.
        attributeValue = '';
      } else {
        // `setAttribute` with objects becomes only `[object]` in IE8/9,
        // ('' + value) makes it output the correct toString()-value.
        {
          attributeValue = '' + value;
        }

        if (propertyInfo.sanitizeURL) {
          sanitizeURL(attributeValue.toString());
        }
      }

      if (attributeNamespace) {
        node.setAttributeNS(attributeNamespace, attributeName, attributeValue);
      } else {
        node.setAttribute(attributeName, attributeValue);
      }
    }
  }

  var ReactInternals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
  var _assign = ReactInternals.assign;

  // ATTENTION
  // When adding new symbols to this file,
  // Please consider also adding to 'react-devtools-shared/src/backend/ReactSymbols'
  // The Symbol used to tag the ReactElement-like types. If there is no native Symbol
  // nor polyfill, then a plain number is used for performance.
  var REACT_ELEMENT_TYPE = 0xeac7;
  var REACT_PORTAL_TYPE = 0xeaca;
  var REACT_FRAGMENT_TYPE = 0xeacb;
  var REACT_STRICT_MODE_TYPE = 0xeacc;
  var REACT_PROFILER_TYPE = 0xead2;
  var REACT_PROVIDER_TYPE = 0xeacd;
  var REACT_CONTEXT_TYPE = 0xeace;
  var REACT_FORWARD_REF_TYPE = 0xead0;
  var REACT_SUSPENSE_TYPE = 0xead1;
  var REACT_SUSPENSE_LIST_TYPE = 0xead8;
  var REACT_MEMO_TYPE = 0xead3;
  var REACT_LAZY_TYPE = 0xead4;
  var REACT_BLOCK_TYPE = 0xead9;
  var REACT_SERVER_BLOCK_TYPE = 0xeada;
  var REACT_FUNDAMENTAL_TYPE = 0xead5;
  var REACT_SCOPE_TYPE = 0xead7;
  var REACT_OPAQUE_ID_TYPE = 0xeae0;
  var REACT_DEBUG_TRACING_MODE_TYPE = 0xeae1;
  var REACT_OFFSCREEN_TYPE = 0xeae2;
  var REACT_LEGACY_HIDDEN_TYPE = 0xeae3;

  if (typeof Symbol === 'function' && Symbol.for) {
    var symbolFor = Symbol.for;
    REACT_ELEMENT_TYPE = symbolFor('react.element');
    REACT_PORTAL_TYPE = symbolFor('react.portal');
    REACT_FRAGMENT_TYPE = symbolFor('react.fragment');
    REACT_STRICT_MODE_TYPE = symbolFor('react.strict_mode');
    REACT_PROFILER_TYPE = symbolFor('react.profiler');
    REACT_PROVIDER_TYPE = symbolFor('react.provider');
    REACT_CONTEXT_TYPE = symbolFor('react.context');
    REACT_FORWARD_REF_TYPE = symbolFor('react.forward_ref');
    REACT_SUSPENSE_TYPE = symbolFor('react.suspense');
    REACT_SUSPENSE_LIST_TYPE = symbolFor('react.suspense_list');
    REACT_MEMO_TYPE = symbolFor('react.memo');
    REACT_LAZY_TYPE = symbolFor('react.lazy');
    REACT_BLOCK_TYPE = symbolFor('react.block');
    REACT_SERVER_BLOCK_TYPE = symbolFor('react.server.block');
    REACT_FUNDAMENTAL_TYPE = symbolFor('react.fundamental');
    REACT_SCOPE_TYPE = symbolFor('react.scope');
    REACT_OPAQUE_ID_TYPE = symbolFor('react.opaque.id');
    REACT_DEBUG_TRACING_MODE_TYPE = symbolFor('react.debug_trace_mode');
    REACT_OFFSCREEN_TYPE = symbolFor('react.offscreen');
    REACT_LEGACY_HIDDEN_TYPE = symbolFor('react.legacy_hidden');
  }

  var MAYBE_ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
  var FAUX_ITERATOR_SYMBOL = '@@iterator';
  function getIteratorFn(maybeIterable) {
    if (maybeIterable === null || typeof maybeIterable !== 'object') {
      return null;
    }

    var maybeIterator = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL];

    if (typeof maybeIterator === 'function') {
      return maybeIterator;
    }

    return null;
  }

  // Helpers to patch console.logs to avoid logging during side-effect free
  // replaying on render function. This currently only patches the object
  // lazily which won't cover if the log function was extracted eagerly.
  // We could also eagerly patch the method.
  var disabledDepth = 0;
  var prevLog;
  var prevInfo;
  var prevWarn;
  var prevError;
  var prevGroup;
  var prevGroupCollapsed;
  var prevGroupEnd;

  function disabledLog() {}

  disabledLog.__reactDisabledLog = true;
  function disableLogs() {
    {
      if (disabledDepth === 0) {
        /* eslint-disable react-internal/no-production-logging */
        prevLog = console.log;
        prevInfo = console.info;
        prevWarn = console.warn;
        prevError = console.error;
        prevGroup = console.group;
        prevGroupCollapsed = console.groupCollapsed;
        prevGroupEnd = console.groupEnd; // https://github.com/facebook/react/issues/19099

        var props = {
          configurable: true,
          enumerable: true,
          value: disabledLog,
          writable: true
        }; // $FlowFixMe Flow thinks console is immutable.

        Object.defineProperties(console, {
          info: props,
          log: props,
          warn: props,
          error: props,
          group: props,
          groupCollapsed: props,
          groupEnd: props
        });
        /* eslint-enable react-internal/no-production-logging */
      }

      disabledDepth++;
    }
  }
  function reenableLogs() {
    {
      disabledDepth--;

      if (disabledDepth === 0) {
        /* eslint-disable react-internal/no-production-logging */
        var props = {
          configurable: true,
          enumerable: true,
          writable: true
        }; // $FlowFixMe Flow thinks console is immutable.

        Object.defineProperties(console, {
          log: _assign({}, props, {
            value: prevLog
          }),
          info: _assign({}, props, {
            value: prevInfo
          }),
          warn: _assign({}, props, {
            value: prevWarn
          }),
          error: _assign({}, props, {
            value: prevError
          }),
          group: _assign({}, props, {
            value: prevGroup
          }),
          groupCollapsed: _assign({}, props, {
            value: prevGroupCollapsed
          }),
          groupEnd: _assign({}, props, {
            value: prevGroupEnd
          })
        });
        /* eslint-enable react-internal/no-production-logging */
      }

      if (disabledDepth < 0) {
        error('disabledDepth fell below zero. ' + 'This is a bug in React. Please file an issue.');
      }
    }
  }

  var ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;
  var prefix;
  function describeBuiltInComponentFrame(name, source, ownerFn) {
    {
      if (prefix === undefined) {
        // Extract the VM specific prefix used by each line.
        try {
          throw Error();
        } catch (x) {
          var match = x.stack.trim().match(/\n( *(at )?)/);
          prefix = match && match[1] || '';
        }
      } // We use the prefix to ensure our stacks line up with native stack frames.


      return '\n' + prefix + name;
    }
  }
  var reentry = false;
  var componentFrameCache;

  {
    var PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map;
    componentFrameCache = new PossiblyWeakMap();
  }

  function describeNativeComponentFrame(fn, construct) {
    // If something asked for a stack inside a fake render, it should get ignored.
    if (!fn || reentry) {
      return '';
    }

    {
      var frame = componentFrameCache.get(fn);

      if (frame !== undefined) {
        return frame;
      }
    }

    var control;
    reentry = true;
    var previousPrepareStackTrace = Error.prepareStackTrace; // $FlowFixMe It does accept undefined.

    Error.prepareStackTrace = undefined;
    var previousDispatcher;

    {
      previousDispatcher = ReactCurrentDispatcher.current; // Set the dispatcher in DEV because this might be call in the render function
      // for warnings.

      ReactCurrentDispatcher.current = null;
      disableLogs();
    }

    try {
      // This should throw.
      if (construct) {
        // Something should be setting the props in the constructor.
        var Fake = function () {
          throw Error();
        }; // $FlowFixMe


        Object.defineProperty(Fake.prototype, 'props', {
          set: function () {
            // We use a throwing setter instead of frozen or non-writable props
            // because that won't throw in a non-strict mode function.
            throw Error();
          }
        });

        if (typeof Reflect === 'object' && Reflect.construct) {
          // We construct a different control for this case to include any extra
          // frames added by the construct call.
          try {
            Reflect.construct(Fake, []);
          } catch (x) {
            control = x;
          }

          Reflect.construct(fn, [], Fake);
        } else {
          try {
            Fake.call();
          } catch (x) {
            control = x;
          }

          fn.call(Fake.prototype);
        }
      } else {
        try {
          throw Error();
        } catch (x) {
          control = x;
        }

        fn();
      }
    } catch (sample) {
      // This is inlined manually because closure doesn't do it for us.
      if (sample && control && typeof sample.stack === 'string') {
        // This extracts the first frame from the sample that isn't also in the control.
        // Skipping one frame that we assume is the frame that calls the two.
        var sampleLines = sample.stack.split('\n');
        var controlLines = control.stack.split('\n');
        var s = sampleLines.length - 1;
        var c = controlLines.length - 1;

        while (s >= 1 && c >= 0 && sampleLines[s] !== controlLines[c]) {
          // We expect at least one stack frame to be shared.
          // Typically this will be the root most one. However, stack frames may be
          // cut off due to maximum stack limits. In this case, one maybe cut off
          // earlier than the other. We assume that the sample is longer or the same
          // and there for cut off earlier. So we should find the root most frame in
          // the sample somewhere in the control.
          c--;
        }

        for (; s >= 1 && c >= 0; s--, c--) {
          // Next we find the first one that isn't the same which should be the
          // frame that called our sample function and the control.
          if (sampleLines[s] !== controlLines[c]) {
            // In V8, the first line is describing the message but other VMs don't.
            // If we're about to return the first line, and the control is also on the same
            // line, that's a pretty good indicator that our sample threw at same line as
            // the control. I.e. before we entered the sample frame. So we ignore this result.
            // This can happen if you passed a class to function component, or non-function.
            if (s !== 1 || c !== 1) {
              do {
                s--;
                c--; // We may still have similar intermediate frames from the construct call.
                // The next one that isn't the same should be our match though.

                if (c < 0 || sampleLines[s] !== controlLines[c]) {
                  // V8 adds a "new" prefix for native classes. Let's remove it to make it prettier.
                  var _frame = '\n' + sampleLines[s].replace(' at new ', ' at ');

                  {
                    if (typeof fn === 'function') {
                      componentFrameCache.set(fn, _frame);
                    }
                  } // Return the line we found.


                  return _frame;
                }
              } while (s >= 1 && c >= 0);
            }

            break;
          }
        }
      }
    } finally {
      reentry = false;

      {
        ReactCurrentDispatcher.current = previousDispatcher;
        reenableLogs();
      }

      Error.prepareStackTrace = previousPrepareStackTrace;
    } // Fallback to just using the name if we couldn't make it throw.


    var name = fn ? fn.displayName || fn.name : '';
    var syntheticFrame = name ? describeBuiltInComponentFrame(name) : '';

    {
      if (typeof fn === 'function') {
        componentFrameCache.set(fn, syntheticFrame);
      }
    }

    return syntheticFrame;
  }

  function describeClassComponentFrame(ctor, source, ownerFn) {
    {
      return describeNativeComponentFrame(ctor, true);
    }
  }
  function describeFunctionComponentFrame(fn, source, ownerFn) {
    {
      return describeNativeComponentFrame(fn, false);
    }
  }

  function shouldConstruct(Component) {
    var prototype = Component.prototype;
    return !!(prototype && prototype.isReactComponent);
  }

  function describeUnknownElementTypeFrameInDEV(type, source, ownerFn) {

    if (type == null) {
      return '';
    }

    if (typeof type === 'function') {
      {
        return describeNativeComponentFrame(type, shouldConstruct(type));
      }
    }

    if (typeof type === 'string') {
      return describeBuiltInComponentFrame(type);
    }

    switch (type) {
      case REACT_SUSPENSE_TYPE:
        return describeBuiltInComponentFrame('Suspense');

      case REACT_SUSPENSE_LIST_TYPE:
        return describeBuiltInComponentFrame('SuspenseList');
    }

    if (typeof type === 'object') {
      switch (type.$$typeof) {
        case REACT_FORWARD_REF_TYPE:
          return describeFunctionComponentFrame(type.render);

        case REACT_MEMO_TYPE:
          // Memo may contain any component type so we recursively resolve it.
          return describeUnknownElementTypeFrameInDEV(type.type, source, ownerFn);

        case REACT_BLOCK_TYPE:
          return describeFunctionComponentFrame(type._render);

        case REACT_LAZY_TYPE:
          {
            var lazyComponent = type;
            var payload = lazyComponent._payload;
            var init = lazyComponent._init;

            try {
              // Lazy may contain any component type so we recursively resolve it.
              return describeUnknownElementTypeFrameInDEV(init(payload), source, ownerFn);
            } catch (x) {}
          }
      }
    }

    return '';
  }

  function describeFiber(fiber) {
    var owner =  fiber._debugOwner ? fiber._debugOwner.type : null ;
    var source =  fiber._debugSource ;

    switch (fiber.tag) {
      case HostComponent:
        return describeBuiltInComponentFrame(fiber.type);

      case LazyComponent:
        return describeBuiltInComponentFrame('Lazy');

      case SuspenseComponent:
        return describeBuiltInComponentFrame('Suspense');

      case SuspenseListComponent:
        return describeBuiltInComponentFrame('SuspenseList');

      case FunctionComponent:
      case IndeterminateComponent:
      case SimpleMemoComponent:
        return describeFunctionComponentFrame(fiber.type);

      case ForwardRef:
        return describeFunctionComponentFrame(fiber.type.render);

      case Block:
        return describeFunctionComponentFrame(fiber.type._render);

      case ClassComponent:
        return describeClassComponentFrame(fiber.type);

      default:
        return '';
    }
  }

  function getStackByFiberInDevAndProd(workInProgress) {
    try {
      var info = '';
      var node = workInProgress;

      do {
        info += describeFiber(node);
        node = node.return;
      } while (node);

      return info;
    } catch (x) {
      return '\nError generating stack: ' + x.message + '\n' + x.stack;
    }
  }

  function getWrappedName(outerType, innerType, wrapperName) {
    var functionName = innerType.displayName || innerType.name || '';
    return outerType.displayName || (functionName !== '' ? wrapperName + "(" + functionName + ")" : wrapperName);
  }

  function getContextName(type) {
    return type.displayName || 'Context';
  }

  function getComponentName(type) {
    if (type == null) {
      // Host root, text node or just invalid type.
      return null;
    }

    {
      if (typeof type.tag === 'number') {
        error('Received an unexpected object in getComponentName(). ' + 'This is likely a bug in React. Please file an issue.');
      }
    }

    if (typeof type === 'function') {
      return type.displayName || type.name || null;
    }

    if (typeof type === 'string') {
      return type;
    }

    switch (type) {
      case REACT_FRAGMENT_TYPE:
        return 'Fragment';

      case REACT_PORTAL_TYPE:
        return 'Portal';

      case REACT_PROFILER_TYPE:
        return 'Profiler';

      case REACT_STRICT_MODE_TYPE:
        return 'StrictMode';

      case REACT_SUSPENSE_TYPE:
        return 'Suspense';

      case REACT_SUSPENSE_LIST_TYPE:
        return 'SuspenseList';
    }

    if (typeof type === 'object') {
      switch (type.$$typeof) {
        case REACT_CONTEXT_TYPE:
          var context = type;
          return getContextName(context) + '.Consumer';

        case REACT_PROVIDER_TYPE:
          var provider = type;
          return getContextName(provider._context) + '.Provider';

        case REACT_FORWARD_REF_TYPE:
          return getWrappedName(type, type.render, 'ForwardRef');

        case REACT_MEMO_TYPE:
          return getComponentName(type.type);

        case REACT_BLOCK_TYPE:
          return getComponentName(type._render);

        case REACT_LAZY_TYPE:
          {
            var lazyComponent = type;
            var payload = lazyComponent._payload;
            var init = lazyComponent._init;

            try {
              return getComponentName(init(payload));
            } catch (x) {
              return null;
            }
          }
      }
    }

    return null;
  }

  var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
  var current = null;
  var isRendering = false;
  function getCurrentFiberOwnerNameInDevOrNull() {
    {
      if (current === null) {
        return null;
      }

      var owner = current._debugOwner;

      if (owner !== null && typeof owner !== 'undefined') {
        return getComponentName(owner.type);
      }
    }

    return null;
  }

  function getCurrentFiberStackInDev() {
    {
      if (current === null) {
        return '';
      } // Safe because if current fiber exists, we are reconciling,
      // and it is guaranteed to be the work-in-progress version.


      return getStackByFiberInDevAndProd(current);
    }
  }

  function resetCurrentFiber() {
    {
      ReactDebugCurrentFrame.getCurrentStack = null;
      current = null;
      isRendering = false;
    }
  }
  function setCurrentFiber(fiber) {
    {
      ReactDebugCurrentFrame.getCurrentStack = getCurrentFiberStackInDev;
      current = fiber;
      isRendering = false;
    }
  }
  function setIsRendering(rendering) {
    {
      isRendering = rendering;
    }
  }
  function getIsRendering() {
    {
      return isRendering;
    }
  }

  // Flow does not allow string concatenation of most non-string types. To work
  // around this limitation, we use an opaque type that can only be obtained by
  // passing the value through getToStringValue first.
  function toString(value) {
    return '' + value;
  }
  function getToStringValue(value) {
    switch (typeof value) {
      case 'boolean':
      case 'number':
      case 'object':
      case 'string':
      case 'undefined':
        return value;

      default:
        // function, symbol are assigned as empty strings
        return '';
    }
  }

  var hasReadOnlyValue = {
    button: true,
    checkbox: true,
    image: true,
    hidden: true,
    radio: true,
    reset: true,
    submit: true
  };
  function checkControlledValueProps(tagName, props) {
    {
      if (!(hasReadOnlyValue[props.type] || props.onChange || props.onInput || props.readOnly || props.disabled || props.value == null)) {
        error('You provided a `value` prop to a form field without an ' + '`onChange` handler. This will render a read-only field. If ' + 'the field should be mutable use `defaultValue`. Otherwise, ' + 'set either `onChange` or `readOnly`.');
      }

      if (!(props.onChange || props.readOnly || props.disabled || props.checked == null)) {
        error('You provided a `checked` prop to a form field without an ' + '`onChange` handler. This will render a read-only field. If ' + 'the field should be mutable use `defaultChecked`. Otherwise, ' + 'set either `onChange` or `readOnly`.');
      }
    }
  }

  function isCheckable(elem) {
    var type = elem.type;
    var nodeName = elem.nodeName;
    return nodeName && nodeName.toLowerCase() === 'input' && (type === 'checkbox' || type === 'radio');
  }

  function getTracker(node) {
    return node._valueTracker;
  }

  function detachTracker(node) {
    node._valueTracker = null;
  }

  function getValueFromNode(node) {
    var value = '';

    if (!node) {
      return value;
    }

    if (isCheckable(node)) {
      value = node.checked ? 'true' : 'false';
    } else {
      value = node.value;
    }

    return value;
  }

  function trackValueOnNode(node) {
    var valueField = isCheckable(node) ? 'checked' : 'value';
    var descriptor = Object.getOwnPropertyDescriptor(node.constructor.prototype, valueField);
    var currentValue = '' + node[valueField]; // if someone has already defined a value or Safari, then bail
    // and don't track value will cause over reporting of changes,
    // but it's better then a hard failure
    // (needed for certain tests that spyOn input values and Safari)

    if (node.hasOwnProperty(valueField) || typeof descriptor === 'undefined' || typeof descriptor.get !== 'function' || typeof descriptor.set !== 'function') {
      return;
    }

    var get = descriptor.get,
        set = descriptor.set;
    Object.defineProperty(node, valueField, {
      configurable: true,
      get: function () {
        return get.call(this);
      },
      set: function (value) {
        currentValue = '' + value;
        set.call(this, value);
      }
    }); // We could've passed this the first time
    // but it triggers a bug in IE11 and Edge 14/15.
    // Calling defineProperty() again should be equivalent.
    // https://github.com/facebook/react/issues/11768

    Object.defineProperty(node, valueField, {
      enumerable: descriptor.enumerable
    });
    var tracker = {
      getValue: function () {
        return currentValue;
      },
      setValue: function (value) {
        currentValue = '' + value;
      },
      stopTracking: function () {
        detachTracker(node);
        delete node[valueField];
      }
    };
    return tracker;
  }

  function track(node) {
    if (getTracker(node)) {
      return;
    } // TODO: Once it's just Fiber we can move this to node._wrapperState


    node._valueTracker = trackValueOnNode(node);
  }
  function updateValueIfChanged(node) {
    if (!node) {
      return false;
    }

    var tracker = getTracker(node); // if there is no tracker at this point it's unlikely
    // that trying again will succeed

    if (!tracker) {
      return true;
    }

    var lastValue = tracker.getValue();
    var nextValue = getValueFromNode(node);

    if (nextValue !== lastValue) {
      tracker.setValue(nextValue);
      return true;
    }

    return false;
  }

  function getActiveElement(doc) {
    doc = doc || (typeof document !== 'undefined' ? document : undefined);

    if (typeof doc === 'undefined') {
      return null;
    }

    try {
      return doc.activeElement || doc.body;
    } catch (e) {
      return doc.body;
    }
  }

  var didWarnValueDefaultValue = false;
  var didWarnCheckedDefaultChecked = false;
  var didWarnControlledToUncontrolled = false;
  var didWarnUncontrolledToControlled = false;

  function isControlled(props) {
    var usesChecked = props.type === 'checkbox' || props.type === 'radio';
    return usesChecked ? props.checked != null : props.value != null;
  }
  /**
   * Implements an <input> host component that allows setting these optional
   * props: `checked`, `value`, `defaultChecked`, and `defaultValue`.
   *
   * If `checked` or `value` are not supplied (or null/undefined), user actions
   * that affect the checked state or value will trigger updates to the element.
   *
   * If they are supplied (and not null/undefined), the rendered element will not
   * trigger updates to the element. Instead, the props must change in order for
   * the rendered element to be updated.
   *
   * The rendered element will be initialized as unchecked (or `defaultChecked`)
   * with an empty value (or `defaultValue`).
   *
   * See http://www.w3.org/TR/2012/WD-html5-20121025/the-input-element.html
   */


  function getHostProps(element, props) {
    var node = element;
    var checked = props.checked;

    var hostProps = _assign({}, props, {
      defaultChecked: undefined,
      defaultValue: undefined,
      value: undefined,
      checked: checked != null ? checked : node._wrapperState.initialChecked
    });

    return hostProps;
  }
  function initWrapperState(element, props) {
    {
      checkControlledValueProps('input', props);

      if (props.checked !== undefined && props.defaultChecked !== undefined && !didWarnCheckedDefaultChecked) {
        error('%s contains an input of type %s with both checked and defaultChecked props. ' + 'Input elements must be either controlled or uncontrolled ' + '(specify either the checked prop, or the defaultChecked prop, but not ' + 'both). Decide between using a controlled or uncontrolled input ' + 'element and remove one of these props. More info: ' + 'https://reactjs.org/link/controlled-components', getCurrentFiberOwnerNameInDevOrNull() || 'A component', props.type);

        didWarnCheckedDefaultChecked = true;
      }

      if (props.value !== undefined && props.defaultValue !== undefined && !didWarnValueDefaultValue) {
        error('%s contains an input of type %s with both value and defaultValue props. ' + 'Input elements must be either controlled or uncontrolled ' + '(specify either the value prop, or the defaultValue prop, but not ' + 'both). Decide between using a controlled or uncontrolled input ' + 'element and remove one of these props. More info: ' + 'https://reactjs.org/link/controlled-components', getCurrentFiberOwnerNameInDevOrNull() || 'A component', props.type);

        didWarnValueDefaultValue = true;
      }
    }

    var node = element;
    var defaultValue = props.defaultValue == null ? '' : props.defaultValue;
    node._wrapperState = {
      initialChecked: props.checked != null ? props.checked : props.defaultChecked,
      initialValue: getToStringValue(props.value != null ? props.value : defaultValue),
      controlled: isControlled(props)
    };
  }
  function updateChecked(element, props) {
    var node = element;
    var checked = props.checked;

    if (checked != null) {
      setValueForProperty(node, 'checked', checked, false);
    }
  }
  function updateWrapper(element, props) {
    var node = element;

    {
      var controlled = isControlled(props);

      if (!node._wrapperState.controlled && controlled && !didWarnUncontrolledToControlled) {
        error('A component is changing an uncontrolled input to be controlled. ' + 'This is likely caused by the value changing from undefined to ' + 'a defined value, which should not happen. ' + 'Decide between using a controlled or uncontrolled input ' + 'element for the lifetime of the component. More info: https://reactjs.org/link/controlled-components');

        didWarnUncontrolledToControlled = true;
      }

      if (node._wrapperState.controlled && !controlled && !didWarnControlledToUncontrolled) {
        error('A component is changing a controlled input to be uncontrolled. ' + 'This is likely caused by the value changing from a defined to ' + 'undefined, which should not happen. ' + 'Decide between using a controlled or uncontrolled input ' + 'element for the lifetime of the component. More info: https://reactjs.org/link/controlled-components');

        didWarnControlledToUncontrolled = true;
      }
    }

    updateChecked(element, props);
    var value = getToStringValue(props.value);
    var type = props.type;

    if (value != null) {
      if (type === 'number') {
        if (value === 0 && node.value === '' || // We explicitly want to coerce to number here if possible.
        // eslint-disable-next-line
        node.value != value) {
          node.value = toString(value);
        }
      } else if (node.value !== toString(value)) {
        node.value = toString(value);
      }
    } else if (type === 'submit' || type === 'reset') {
      // Submit/reset inputs need the attribute removed completely to avoid
      // blank-text buttons.
      node.removeAttribute('value');
      return;
    }

    {
      // When syncing the value attribute, the value comes from a cascade of
      // properties:
      //  1. The value React property
      //  2. The defaultValue React property
      //  3. Otherwise there should be no change
      if (props.hasOwnProperty('value')) {
        setDefaultValue(node, props.type, value);
      } else if (props.hasOwnProperty('defaultValue')) {
        setDefaultValue(node, props.type, getToStringValue(props.defaultValue));
      }
    }

    {
      // When syncing the checked attribute, it only changes when it needs
      // to be removed, such as transitioning from a checkbox into a text input
      if (props.checked == null && props.defaultChecked != null) {
        node.defaultChecked = !!props.defaultChecked;
      }
    }
  }
  function postMountWrapper(element, props, isHydrating) {
    var node = element; // Do not assign value if it is already set. This prevents user text input
    // from being lost during SSR hydration.

    if (props.hasOwnProperty('value') || props.hasOwnProperty('defaultValue')) {
      var type = props.type;
      var isButton = type === 'submit' || type === 'reset'; // Avoid setting value attribute on submit/reset inputs as it overrides the
      // default value provided by the browser. See: #12872

      if (isButton && (props.value === undefined || props.value === null)) {
        return;
      }

      var initialValue = toString(node._wrapperState.initialValue); // Do not assign value if it is already set. This prevents user text input
      // from being lost during SSR hydration.

      if (!isHydrating) {
        {
          // When syncing the value attribute, the value property should use
          // the wrapperState._initialValue property. This uses:
          //
          //   1. The value React property when present
          //   2. The defaultValue React property when present
          //   3. An empty string
          if (initialValue !== node.value) {
            node.value = initialValue;
          }
        }
      }

      {
        // Otherwise, the value attribute is synchronized to the property,
        // so we assign defaultValue to the same thing as the value property
        // assignment step above.
        node.defaultValue = initialValue;
      }
    } // Normally, we'd just do `node.checked = node.checked` upon initial mount, less this bug
    // this is needed to work around a chrome bug where setting defaultChecked
    // will sometimes influence the value of checked (even after detachment).
    // Reference: https://bugs.chromium.org/p/chromium/issues/detail?id=608416
    // We need to temporarily unset name to avoid disrupting radio button groups.


    var name = node.name;

    if (name !== '') {
      node.name = '';
    }

    {
      // When syncing the checked attribute, both the checked property and
      // attribute are assigned at the same time using defaultChecked. This uses:
      //
      //   1. The checked React property when present
      //   2. The defaultChecked React property when present
      //   3. Otherwise, false
      node.defaultChecked = !node.defaultChecked;
      node.defaultChecked = !!node._wrapperState.initialChecked;
    }

    if (name !== '') {
      node.name = name;
    }
  }
  function restoreControlledState(element, props) {
    var node = element;
    updateWrapper(node, props);
    updateNamedCousins(node, props);
  }

  function updateNamedCousins(rootNode, props) {
    var name = props.name;

    if (props.type === 'radio' && name != null) {
      var queryRoot = rootNode;

      while (queryRoot.parentNode) {
        queryRoot = queryRoot.parentNode;
      } // If `rootNode.form` was non-null, then we could try `form.elements`,
      // but that sometimes behaves strangely in IE8. We could also try using
      // `form.getElementsByName`, but that will only return direct children
      // and won't include inputs that use the HTML5 `form=` attribute. Since
      // the input might not even be in a form. It might not even be in the
      // document. Let's just use the local `querySelectorAll` to ensure we don't
      // miss anything.


      var group = queryRoot.querySelectorAll('input[name=' + JSON.stringify('' + name) + '][type="radio"]');

      for (var i = 0; i < group.length; i++) {
        var otherNode = group[i];

        if (otherNode === rootNode || otherNode.form !== rootNode.form) {
          continue;
        } // This will throw if radio buttons rendered by different copies of React
        // and the same name are rendered into the same form (same as #1939).
        // That's probably okay; we don't support it just as we don't support
        // mixing React radio buttons with non-React ones.


        var otherProps = getFiberCurrentPropsFromNode(otherNode);

        if (!otherProps) {
          {
            throw Error( "ReactDOMInput: Mixing React and non-React radio inputs with the same `name` is not supported." );
          }
        } // We need update the tracked value on the named cousin since the value
        // was changed but the input saw no event or value set


        updateValueIfChanged(otherNode); // If this is a controlled radio button group, forcing the input that
        // was previously checked to update will cause it to be come re-checked
        // as appropriate.

        updateWrapper(otherNode, otherProps);
      }
    }
  } // In Chrome, assigning defaultValue to certain input types triggers input validation.
  // For number inputs, the display value loses trailing decimal points. For email inputs,
  // Chrome raises "The specified value <x> is not a valid email address".
  //
  // Here we check to see if the defaultValue has actually changed, avoiding these problems
  // when the user is inputting text
  //
  // https://github.com/facebook/react/issues/7253


  function setDefaultValue(node, type, value) {
    if ( // Focused number inputs synchronize on blur. See ChangeEventPlugin.js
    type !== 'number' || getActiveElement(node.ownerDocument) !== node) {
      if (value == null) {
        node.defaultValue = toString(node._wrapperState.initialValue);
      } else if (node.defaultValue !== toString(value)) {
        node.defaultValue = toString(value);
      }
    }
  }

  var didWarnSelectedSetOnOption = false;
  var didWarnInvalidChild = false;

  function flattenChildren(children) {
    var content = ''; // Flatten children. We'll warn if they are invalid
    // during validateProps() which runs for hydration too.
    // Note that this would throw on non-element objects.
    // Elements are stringified (which is normally irrelevant
    // but matters for <fbt>).

    React.Children.forEach(children, function (child) {
      if (child == null) {
        return;
      }

      content += child; // Note: we don't warn about invalid children here.
      // Instead, this is done separately below so that
      // it happens during the hydration code path too.
    });
    return content;
  }
  /**
   * Implements an <option> host component that warns when `selected` is set.
   */


  function validateProps(element, props) {
    {
      // This mirrors the code path above, but runs for hydration too.
      // Warn about invalid children here so that client and hydration are consistent.
      // TODO: this seems like it could cause a DEV-only throw for hydration
      // if children contains a non-element object. We should try to avoid that.
      if (typeof props.children === 'object' && props.children !== null) {
        React.Children.forEach(props.children, function (child) {
          if (child == null) {
            return;
          }

          if (typeof child === 'string' || typeof child === 'number') {
            return;
          }

          if (typeof child.type !== 'string') {
            return;
          }

          if (!didWarnInvalidChild) {
            didWarnInvalidChild = true;

            error('Only strings and numbers are supported as <option> children.');
          }
        });
      } // TODO: Remove support for `selected` in <option>.


      if (props.selected != null && !didWarnSelectedSetOnOption) {
        error('Use the `defaultValue` or `value` props on <select> instead of ' + 'setting `selected` on <option>.');

        didWarnSelectedSetOnOption = true;
      }
    }
  }
  function postMountWrapper$1(element, props) {
    // value="" should make a value attribute (#6219)
    if (props.value != null) {
      element.setAttribute('value', toString(getToStringValue(props.value)));
    }
  }
  function getHostProps$1(element, props) {
    var hostProps = _assign({
      children: undefined
    }, props);

    var content = flattenChildren(props.children);

    if (content) {
      hostProps.children = content;
    }

    return hostProps;
  }

  var didWarnValueDefaultValue$1;

  {
    didWarnValueDefaultValue$1 = false;
  }

  function getDeclarationErrorAddendum() {
    var ownerName = getCurrentFiberOwnerNameInDevOrNull();

    if (ownerName) {
      return '\n\nCheck the render method of `' + ownerName + '`.';
    }

    return '';
  }

  var valuePropNames = ['value', 'defaultValue'];
  /**
   * Validation function for `value` and `defaultValue`.
   */

  function checkSelectPropTypes(props) {
    {
      checkControlledValueProps('select', props);

      for (var i = 0; i < valuePropNames.length; i++) {
        var propName = valuePropNames[i];

        if (props[propName] == null) {
          continue;
        }

        var isArray = Array.isArray(props[propName]);

        if (props.multiple && !isArray) {
          error('The `%s` prop supplied to <select> must be an array if ' + '`multiple` is true.%s', propName, getDeclarationErrorAddendum());
        } else if (!props.multiple && isArray) {
          error('The `%s` prop supplied to <select> must be a scalar ' + 'value if `multiple` is false.%s', propName, getDeclarationErrorAddendum());
        }
      }
    }
  }

  function updateOptions(node, multiple, propValue, setDefaultSelected) {
    var options = node.options;

    if (multiple) {
      var selectedValues = propValue;
      var selectedValue = {};

      for (var i = 0; i < selectedValues.length; i++) {
        // Prefix to avoid chaos with special keys.
        selectedValue['$' + selectedValues[i]] = true;
      }

      for (var _i = 0; _i < options.length; _i++) {
        var selected = selectedValue.hasOwnProperty('$' + options[_i].value);

        if (options[_i].selected !== selected) {
          options[_i].selected = selected;
        }

        if (selected && setDefaultSelected) {
          options[_i].defaultSelected = true;
        }
      }
    } else {
      // Do not set `select.value` as exact behavior isn't consistent across all
      // browsers for all cases.
      var _selectedValue = toString(getToStringValue(propValue));

      var defaultSelected = null;

      for (var _i2 = 0; _i2 < options.length; _i2++) {
        if (options[_i2].value === _selectedValue) {
          options[_i2].selected = true;

          if (setDefaultSelected) {
            options[_i2].defaultSelected = true;
          }

          return;
        }

        if (defaultSelected === null && !options[_i2].disabled) 

