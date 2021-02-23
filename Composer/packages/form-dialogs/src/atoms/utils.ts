// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/* eslint-disable @typescript-eslint/consistent-type-assertions */

import { FormDialogSchemaTemplate } from '@bfc/shared';

import { PropertyCardData } from '../components/property/types';
import { generateId } from '../utils/base';
import { nameRegex } from '../utils/constants';

import {
  BooleanPropertyPayload,
  FormDialogProperty,
  FormDialogPropertyKind,
  FormDialogPropertyPayload,
  IntegerPropertyPayload,
  NumberPropertyPayload,
  RefPropertyPayload,
  StringPropertyPayload,
  TypedPropertyPayload,
} from './types';

export const templateTypeToJsonSchemaType = (cardData: PropertyCardData, templates: FormDialogSchemaTemplate[]) => {
  const template = templates.find((t) => t.id === cardData.propertyType);
  const isRef = template.type === 'object' && template.$template;

  if (isRef) {
    return { kind: 'ref', ref: template.id };
  }

  const hasEnum = !!cardData.enum;
  if (hasEnum) {
    return { kind: 'string', enums: true };
  }

  return {
    kind: cardData.propertyType,
    format: cardData.format,
  };
};

const $refToRef = ($ref: string) => {
  const [, ref] = $ref.match(/template:(.*)\.schema/);
  return ref;
};

export const jsonSchemaTypeToTemplateType = (
  propertyJson: any,
  templates: FormDialogSchemaTemplate[]
): { propertyType: string; isArray?: boolean } => {
  const jsonType = propertyJson.type ?? 'ref';

  switch (jsonType ?? 'ref') {
    case 'array': {
      return { ...jsonSchemaTypeToTemplateType(propertyJson.items, templates), isArray: true };
    }
    case 'boolean':
    case 'number':
    case 'integer':
      return { propertyType: jsonType };
    case 'string': {
      if (propertyJson.enum) {
        return { propertyType: 'enum' };
      }

      if (propertyJson.format) {
        const template = templates.find(
          (template) => template.format === propertyJson.format && template.type === jsonType
        );
        return { propertyType: template.id };
      }

      return { propertyType: 'string' };
    }
    case 'ref': {
      const ref = $refToRef(propertyJson.$ref);

      const template = templates.find((template) => template.id === ref);

      return { propertyType: template.id };
    }
    default:
      throw new Error(`${jsonType} is not supported!`);
  }
};

export const getDefaultPayload = (kind: FormDialogPropertyKind) => {
  switch (kind) {
    case 'ref':
      return <RefPropertyPayload>{ kind: 'ref' };
    case 'boolean':
      return <BooleanPropertyPayload>{ kind: 'boolean' };
    case 'string':
      return <StringPropertyPayload>{ kind: 'string', entities: [] };
    case 'number':
      return <NumberPropertyPayload>{ kind: 'number', entities: [] };
    case 'integer':
      return <IntegerPropertyPayload>{ kind: 'integer', entities: [] };
    default:
      throw new Error(`Property type: "${kind}" is not supported!`);
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const retrievePayload = (kind: FormDialogPropertyKind, payloadData: any, array = false): FormDialogPropertyPayload => {
  if (array) {
    return retrievePayload(payloadData.items.type || 'ref', payloadData.items);
  }
  switch (kind) {
    case 'ref':
      return <RefPropertyPayload>{ ref: $refToRef(payloadData.$ref) };
    case 'boolean':
      return <BooleanPropertyPayload>{ kind: 'boolean' };
    case 'string':
      return <StringPropertyPayload>{ kind: 'string', entities: payloadData.$entities, enums: payloadData.enum };
    case 'number':
      return <NumberPropertyPayload>{
        kind: 'number',
        minimum: payloadData.minimum,
        maximum: payloadData.maximum,
      };
    case 'integer':
      return <IntegerPropertyPayload>{
        kind: 'integer',
        minimum: payloadData.minimum,
        maximum: payloadData.maximum,
      };
    default:
      throw new Error(`Property of type: ${kind} is not currently supported!`);
  }
};

export const createSchemaStoreFromJson = (
  name: string,
  jsonString: string,
  templates: FormDialogSchemaTemplate[]
): { name: string; properties: PropertyCardData[] } => {
  const json = JSON.parse(jsonString);

  const propertiesJson = json.properties || [];
  const requiredArray = <string[]>(json.required || []);

  const properties = Object.keys(propertiesJson).map((name) => {
    const propertyJson = propertiesJson[name];

    const { isArray, propertyType } = jsonSchemaTypeToTemplateType(propertyJson, templates);
    const isRequired = requiredArray.includes(name);

    delete propertyJson.type;

    return {
      id: generateId(),
      name,
      propertyType,
      isRequired,
      isArray: !!isArray,
      ...propertyJson,
    };
  });

  return { name, properties };
};

const findFirstMissingIndex = (arr: number[], start: number, end: number): number => {
  if (start > end) return end + 1;

  if (start + 1 !== arr[start]) return start;

  const mid = Math.floor(start + (end - start) / 2);

  if (arr[mid] === mid + 1) {
    return findFirstMissingIndex(arr, mid + 1, end);
  }

  return findFirstMissingIndex(arr, start, mid);
};

export const getDuplicateName = (name: string, allNames: readonly string[]) => {
  if (!name) {
    return '';
  }

  const getBestIndex = (origName: string) => {
    const pattern = `${origName} - copy `;
    const otherNames = allNames.filter((n) => n.startsWith(pattern) && n.endsWith(')'));
    const indices: number[] = [];
    for (const otherName of otherNames) {
      const idx = otherName.indexOf(pattern);
      const openPIdx = otherName.indexOf('(', idx);
      const closePIdx = otherName.length - 1;

      try {
        if (openPIdx !== -1 && closePIdx !== -1) {
          const otherIdx = parseInt(otherName.substring(openPIdx + 1, closePIdx), 10);
          indices.push(otherIdx);
        }
      } catch {
        continue;
      }
    }

    if (!indices.length) {
      return 1;
    }

    indices.sort((a, b) => a - b);
    const maxIdx = Math.max(...indices);

    const firstAvailableIdx = findFirstMissingIndex(indices, 0, indices.length - 1);

    return firstAvailableIdx === -1 ? maxIdx + 1 : firstAvailableIdx + 1;
  };

  const cpIndex = name.indexOf(' - copy ');
  const originalName = cpIndex === -1 ? name : name.substring(0, cpIndex);

  const bestIndex = getBestIndex(originalName);

  return `${originalName} - copy (${bestIndex})`;
};

//----------------------------JSON spreading----------------------------

const spreadEntities = (payload: TypedPropertyPayload) =>
  payload?.entities?.length ? { $entities: payload.entities } : {};

const spreadStringSchemaProperty = (payload: StringPropertyPayload) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payloadJson: any = payload?.enums?.length ? { enum: payload.enums } : {};
  if (payload.format) {
    payloadJson.format = payload.format;
  }

  return payloadJson;
};

const spreadNumberSchemaProperty = (payload: NumberPropertyPayload | IntegerPropertyPayload) => {
  return { minimum: payload.minimum, maximum: payload.maximum };
};

const spreadRefSchemaProperty = (payload: RefPropertyPayload) => ({ $ref: `template:${payload.ref}` });

const spreadArraySchemaProperty = (payload: FormDialogPropertyPayload) => {
  const helper = () => {
    switch (payload.kind) {
      case 'string': {
        return {
          type: 'string',
          ...spreadStringSchemaProperty(<StringPropertyPayload>payload),
        };
      }
      case 'number': {
        return {
          type: 'number',
          ...spreadNumberSchemaProperty(<NumberPropertyPayload>payload),
        };
      }
      case 'integer': {
        return {
          type: 'integer',
          ...spreadNumberSchemaProperty(<IntegerPropertyPayload>payload),
        };
      }
      default:
      case 'ref':
        return spreadRefSchemaProperty(<RefPropertyPayload>payload);
    }
  };
  return {
    type: 'array',
    items: helper(),
  };
};

export const spreadSchemaPropertyStore = (property: FormDialogProperty) => {
  if (property.array) {
    return spreadArraySchemaProperty(property.payload);
  }
  switch (property.kind) {
    case 'ref':
      return spreadRefSchemaProperty(<RefPropertyPayload>property.payload);
    case 'boolean': {
      return {
        type: property.kind,
      };
    }
    case 'string':
      return {
        type: property.kind,
        ...spreadEntities(<TypedPropertyPayload>property.payload),
        ...spreadStringSchemaProperty(<StringPropertyPayload>property.payload),
      };
    case 'number':
      return {
        type: property.kind,
        ...spreadEntities(<TypedPropertyPayload>property.payload),
        ...spreadNumberSchemaProperty(<NumberPropertyPayload>property.payload),
      };
    case 'integer':
      return {
        type: property.kind,
        ...spreadEntities(<TypedPropertyPayload>property.payload),
        ...spreadNumberSchemaProperty(<IntegerPropertyPayload>property.payload),
      };
    default:
      throw new Error(`Property type: "${property.kind}" is not supported!`);
  }
};

//----------------------------JSON validation----------------------------

export const validateSchemaPropertyStore = (property: FormDialogProperty) => {
  let payloadValid = false;
  switch (property.kind) {
    case 'ref':
      payloadValid = !!(<RefPropertyPayload>property.payload).ref;
      break;
    case 'string': {
      const stringPayload = <StringPropertyPayload>property.payload;
      payloadValid = !stringPayload.enums || !!stringPayload.enums.length;
      break;
    }
    case 'number': {
      const numberPayload = <NumberPropertyPayload>property.payload;
      payloadValid = !numberPayload.minimum || !numberPayload.maximum || numberPayload.minimum <= numberPayload.maximum;
      break;
    }
    case 'integer': {
      const numberPayload = <IntegerPropertyPayload>property.payload;
      payloadValid = !numberPayload.minimum || !numberPayload.maximum || numberPayload.minimum <= numberPayload.maximum;
      break;
    }
  }

  return !!(payloadValid && property.name && nameRegex.test(property.name));
};
