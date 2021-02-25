/* eslint-disable @typescript-eslint/no-explicit-any */
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { FormDialogSchemaTemplate } from '@bfc/shared';
import { ComboBox } from 'office-ui-fabric-react/lib/ComboBox';
import { Stack } from 'office-ui-fabric-react/lib/Stack';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import * as React from 'react';

import { FieldLabel } from '../common/FieldLabel';
import { ValuePicker } from '../common/ValuePicker';

type Props = {
  template: FormDialogSchemaTemplate;
  cardValues: Record<string, any>;
  onDataChange: (data: Record<string, any>) => void;
};

const renderField = (variable: string, info: Record<string, any>, value: any, onChange: (value: any) => void) => {
  const renderLabel = (helpText: string, tooltipId: string) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (props: any, defaultRender?: (props: any) => JSX.Element | null) => (
      <FieldLabel defaultRender={defaultRender(props)} helpText={helpText} tooltipId={tooltipId} />
    );

  switch (info.type) {
    case 'array':
      return (
        <ValuePicker
          label={info.title}
          values={value || []}
          onChange={onChange}
          onRenderLabel={renderLabel(info.description, variable)}
        />
      );
    case 'string': {
      const hasEnum = !!info.enum;

      return hasEnum ? (
        <ComboBox
          allowFreeform
          autoComplete="on"
          label={info.title}
          options={info.enum.map((v) => ({ key: v, text: v }))}
          selectedKey={value}
          styles={{ root: { maxWidth: 320 }, optionsContainer: { maxHeight: 320 } }}
          onChange={(_, option) => onChange(option.key)}
          onRenderLabel={renderLabel(info.description, variable)}
        />
      ) : (
        <TextField
          label={info.title}
          type={info.type ?? 'text'}
          value={value}
          onChange={(_, newValue) => onChange(newValue)}
          onRenderLabel={renderLabel(info.description, variable)}
        />
      );
    }
    default:
      return (
        <TextField
          label={info.title}
          type={info.type ?? 'text'}
          value={value}
          onChange={(_, newValue) => onChange(newValue)}
          onRenderLabel={renderLabel(info.description, variable)}
        />
      );
  }
};

export const PropertyCardContent = (props: Props) => {
  const { template, cardValues, onDataChange } = props;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { title, description, array, $examples, ...templateInfo } = template.$generator;

  const formFieldChange = (variable: string) => (value: any) => {
    const newFormData = { ...cardValues, [variable]: value };
    onDataChange(newFormData);
  };

  return (
    <Stack tokens={{ childrenGap: 8 }}>
      {Object.keys(templateInfo).map((variable) => (
        <Stack key={variable} verticalAlign="center">
          {renderField(variable, templateInfo[variable], cardValues[variable], formFieldChange(variable))}
        </Stack>
      ))}
    </Stack>
  );
};
