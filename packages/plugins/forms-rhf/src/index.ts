/**
 * React Hook Form Plugin for Scaforge
 * Form handling with React Hook Form and Zod validation
 */
import { z } from 'zod';
import { definePlugin } from '@scaforge/core';

export const formsRhfPlugin = definePlugin({
  name: 'forms-rhf',
  displayName: 'React Hook Form',
  category: 'forms',
  description: 'Form handling with React Hook Form and Zod validation',
  version: '1.0.0',
  
  supportedTemplates: ['nextjs', 'tanstack', 'nuxt', 'hydrogen'],
  
  packages: {
    dependencies: {
      'react-hook-form': '^7.48.2',
      '@hookform/resolvers': '^3.3.2',
    },
    devDependencies: {
      '@hookform/devtools': '^4.3.1',
    },
  },
  
  configSchema: z.object({
    enableDevTools: z.boolean().default(true),
    defaultValidationMode: z.enum(['onChange', 'onBlur', 'onSubmit', 'onTouched', 'all']).default('onChange'),
    defaultRevalidationMode: z.enum(['onChange', 'onBlur', 'onSubmit']).default('onChange'),
    focusFirstError: z.boolean().default(true),
    disableNativeValidation: z.boolean().default(true),
  }),
  
  envVars: [],
  
  files: [
    {
      path: 'src/lib/forms/hooks.ts',
      template: `'use client';

import { useForm, UseFormProps, UseFormReturn, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export function useZodForm<T extends z.ZodType>(
  schema: T,
  options?: Omit<UseFormProps<z.infer<T>>, 'resolver'>
): UseFormReturn<z.infer<T>> {
  return useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    mode: '{{options.defaultValidationMode}}',
    reValidateMode: '{{options.defaultRevalidationMode}}',
    ...options,
  });
}
`,
      overwrite: false,
    },
    {
      path: 'src/components/forms/form-provider.tsx',
      template: `'use client';

import { ReactNode } from 'react';
import { FormProvider as RHFFormProvider, UseFormReturn, FieldValues } from 'react-hook-form';

interface FormProviderProps<T extends FieldValues = FieldValues> {
  form: UseFormReturn<T>;
  children: ReactNode;
  onSubmit?: (data: T) => void | Promise<void>;
  className?: string;
}

export function FormProvider<T extends FieldValues = FieldValues>({
  form,
  children,
  onSubmit,
  className,
}: FormProviderProps<T>) {
  return (
    <RHFFormProvider {...form}>
      <form
        onSubmit={onSubmit ? form.handleSubmit(onSubmit) : undefined}
        className={className}
      >
        {children}
      </form>
    </RHFFormProvider>
  );
}

export { useFormContext } from 'react-hook-form';
`,
      overwrite: false,
    },
    {
      path: 'src/components/forms/form-field.tsx',
      template: `'use client';

import { ReactNode } from 'react';
import { useFormContext, Controller, FieldValues, Path } from 'react-hook-form';

interface FormFieldProps<T extends FieldValues = FieldValues> {
  name: Path<T>;
  label?: string;
  description?: string;
  children: ReactNode;
}

export function FormField<T extends FieldValues = FieldValues>({
  name,
  label,
  description,
  children,
}: FormFieldProps<T>) {
  const { formState: { errors } } = useFormContext<T>();
  const error = errors[name];

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={name} className="text-sm font-medium">
          {label}
        </label>
      )}
      {children}
      {description && !error && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-sm text-destructive">{error.message as string}</p>
      )}
    </div>
  );
}
`,
      overwrite: false,
    },
    {
      path: 'src/components/forms/index.ts',
      template: `export { FormProvider, useFormContext } from './form-provider';
export { FormField } from './form-field';
export { useZodForm } from '@/lib/forms/hooks';
`,
      overwrite: false,
    },
  ],
  
  postInstall: `📝 React Hook Form has been configured successfully!

Next steps:
1. Import form components from '@/components/forms'
2. Create your form schemas with Zod
3. Use useZodForm hook for type-safe forms

Documentation: https://react-hook-form.com`,
});

export default formsRhfPlugin;
