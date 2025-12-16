# React Hook Form Plugin for Scaforge

This plugin integrates React Hook Form with Zod validation into your Scaforge project, providing powerful form handling with type-safe validation, excellent performance, and minimal re-renders.

## Features

- 📝 **React Hook Form** - Performant forms with minimal re-renders
- 🔒 **Zod Validation** - Type-safe schema validation
- 🎯 **Field-level Validation** - Real-time validation feedback
- 🔄 **Form State Management** - Built-in form state handling
- 🎨 **Custom Components** - Pre-built form components
- 📱 **Responsive Design** - Mobile-friendly form layouts
- ♿ **Accessibility** - ARIA labels and keyboard navigation
- 🛠️ **TypeScript Support** - Full type safety throughout

## Installation

```bash
npx scaforge add forms-rhf
```

## Configuration

The plugin will prompt you for configuration options during installation:

- **Enable DevTools**: Include React Hook Form DevTools for development
- **Default Validation Mode**: When to trigger validation (onChange, onBlur, onSubmit)
- **Default Revalidation Mode**: When to revalidate after errors
- **Focus First Error**: Automatically focus the first field with an error
- **Disable Native Validation**: Disable browser's native HTML5 validation

## Usage

### Basic Form with Zod Validation

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormField, FormButton } from '@/components/forms';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

function SignupForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (data: FormData) => {
    console.log('Form data:', data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        form={form}
        name="email"
        label="Email"
        type="email"
        placeholder="Enter your email"
      />
      
      <FormField
        form={form}
        name="password"
        label="Password"
        type="password"
        placeholder="Enter your password"
      />
      
      <FormField
        form={form}
        name="confirmPassword"
        label="Confirm Password"
        type="password"
        placeholder="Confirm your password"
      />
      
      <FormButton
        type="submit"
        loading={form.formState.isSubmitting}
        disabled={!form.formState.isValid}
      >
        Sign Up
      </FormButton>
    </form>
  );
}
```

### Advanced Form with Custom Components

```tsx
import { useZodForm } from '@/lib/forms/hooks';
import { 
  FormProvider, 
  FormField, 
  FormSelect, 
  FormTextarea, 
  FormCheckbox,
  FormRadioGroup,
  FormButton 
} from '@/components/forms';

const profileSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  country: z.string().min(1, 'Please select a country'),
  notifications: z.boolean(),
  theme: z.enum(['light', 'dark', 'system']),
});

function ProfileForm() {
  const form = useZodForm({
    schema: profileSchema,
    defaultValues: {
      firstName: '',
      lastName: '',
      bio: '',
      country: '',
      notifications: true,
      theme: 'system' as const,
    },
  });

  return (
    <FormProvider form={form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            name="firstName"
            label="First Name"
            placeholder="John"
          />
          
          <FormField
            name="lastName"
            label="Last Name"
            placeholder="Doe"
          />
        </div>
        
        <FormTextarea
          name="bio"
          label="Bio"
          placeholder="Tell us about yourself..."
          rows={4}
        />
        
        <FormSelect
          name="country"
          label="Country"
          placeholder="Select your country"
          options={[
            { value: 'us', label: 'United States' },
            { value: 'ca', label: 'Canada' },
            { value: 'uk', label: 'United Kingdom' },
            { value: 'de', label: 'Germany' },
          ]}
        />
        
        <FormCheckbox
          name="notifications"
          label="Email Notifications"
          description="Receive email updates about your account"
        />
        
        <FormRadioGroup
          name="theme"
          label="Theme Preference"
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'System' },
          ]}
        />
        
        <FormButton type="submit">
          Save Profile
        </FormButton>
      </form>
    </FormProvider>
  );
}
```

### Dynamic Forms

```tsx
import { useFieldArray } from 'react-hook-form';
import { FormFieldArray, FormButton } from '@/components/forms';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  emails: z.array(z.object({
    email: z.string().email('Invalid email'),
    type: z.enum(['personal', 'work']),
  })).min(1, 'At least one email is required'),
});

function ContactForm() {
  const form = useZodForm({
    schema: contactSchema,
    defaultValues: {
      name: '',
      emails: [{ email: '', type: 'personal' as const }],
    },
  });

  return (
    <FormProvider form={form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          name="name"
          label="Name"
          placeholder="Enter name"
        />
        
        <FormFieldArray
          name="emails"
          label="Email Addresses"
          renderField={(field, index) => (
            <div className="flex space-x-2">
              <FormField
                name={`emails.${index}.email`}
                placeholder="email@example.com"
                className="flex-1"
              />
              <FormSelect
                name={`emails.${index}.type`}
                options={[
                  { value: 'personal', label: 'Personal' },
                  { value: 'work', label: 'Work' },
                ]}
                className="w-32"
              />
            </div>
          )}
        />
        
        <FormButton type="submit">
          Save Contact
        </FormButton>
      </form>
    </FormProvider>
  );
}
```

## API Reference

### Hooks

- `useZodForm(options)` - Enhanced useForm with Zod integration
- `useFormField(name)` - Get field state and helpers
- `useFormErrors()` - Get all form errors
- `useFormWatch(names?)` - Watch form values

### Components

- `<FormProvider />` - Form context provider
- `<FormField />` - Text input with validation
- `<FormTextarea />` - Textarea with validation
- `<FormSelect />` - Select dropdown with validation
- `<FormCheckbox />` - Checkbox with validation
- `<FormRadioGroup />` - Radio button group
- `<FormFieldArray />` - Dynamic field arrays
- `<FormButton />` - Submit button with loading state

### Utilities

- `createZodSchema()` - Schema builder helpers
- `validateField()` - Manual field validation
- `formatErrors()` - Error message formatting

## Examples

Check out the example components in `src/components/examples/forms-example.tsx` for complete implementation examples.

## Documentation

- [React Hook Form Documentation](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)
- [Scaforge Documentation](https://scaforge.dev)