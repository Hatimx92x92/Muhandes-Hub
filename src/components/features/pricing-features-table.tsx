'use client';

import { Fragment, useState } from 'react';
import { Check, X, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FeatureValue = boolean | string;

export type TieredFeature = {
  label: string;
  starter: FeatureValue;
  pro: FeatureValue;
  business: FeatureValue;
  enterprise: FeatureValue;
};

export type TieredSection = {
  title: string;
  features: TieredFeature[];
};

export type FreeFeature = {
  label: string;
  value: FeatureValue;
};

export type FreeSection = {
  title: string;
  features: FreeFeature[];
};

export type TierInfo = {
  id: string;
  name: string;
  highlighted: boolean;
};

export type PricingFeaturesTableLabels = {
  roleSelector: string;
  freeForever: string;
  roles: {
    contractor: string;
    supplier: string;
    projectOwner: string;
    buyer: string;
  };
  freeRoleTable: {
    feature: string;
    availability: string;
  };
  feature: string;
};

export type PricingFeaturesTableProps = {
  tiers: TierInfo[];
  contractorSections: TieredSection[];
  supplierSections: TieredSection[];
  projectOwnerSections: FreeSection[];
  buyerSections: FreeSection[];
  labels: PricingFeaturesTableLabels;
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TieredFeatureCell({ value }: { value: FeatureValue }) {
  if (value === true) return <Check className="h-5 w-5 text-primary mx-auto" />;
  if (value === false) return <X className="h-5 w-5 text-muted-foreground/40 mx-auto" />;
  if (value === '') return <Minus className="h-4 w-4 text-muted-foreground/30 mx-auto" />;
  return <span className="text-sm text-foreground font-medium">{value}</span>;
}

function FreeFeatureCell({ value }: { value: FeatureValue }) {
  if (value === true) return <Check className="h-5 w-5 text-primary mx-auto" />;
  if (value === false) return <X className="h-5 w-5 text-muted-foreground/40 mx-auto" />;
  return <span className="text-sm text-foreground font-medium">{value}</span>;
}

// ---------------------------------------------------------------------------
// Role buttons
// ---------------------------------------------------------------------------

type Role = 'contractor' | 'supplier' | 'project_owner' | 'buyer';

const ROLES: { id: Role; labelKey: keyof PricingFeaturesTableLabels['roles']; hasTiers: boolean }[] = [
  { id: 'contractor', labelKey: 'contractor', hasTiers: true },
  { id: 'supplier', labelKey: 'supplier', hasTiers: true },
  { id: 'project_owner', labelKey: 'projectOwner', hasTiers: false },
  { id: 'buyer', labelKey: 'buyer', hasTiers: false },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PricingFeaturesTable({
  tiers,
  contractorSections,
  supplierSections,
  projectOwnerSections,
  buyerSections,
  labels,
}: PricingFeaturesTableProps) {
  const [selectedRole, setSelectedRole] = useState<Role>('contractor');

  const isFreRole = selectedRole === 'project_owner' || selectedRole === 'buyer';
  const tieredSections =
    selectedRole === 'contractor' ? contractorSections : supplierSections;
  const freeSections =
    selectedRole === 'project_owner' ? projectOwnerSections : buyerSections;

  return (
    <div className="mt-20">
      {/* Section heading */}
      <h2 className="text-2xl font-extrabold text-foreground mb-4 text-center">
        {labels.feature}
      </h2>

      {/* Role selector */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        <span className="text-sm text-muted-foreground me-1 hidden sm:inline">
          {labels.roleSelector}:
        </span>
        {ROLES.map((role) => (
          <button
            key={role.id}
            type="button"
            onClick={() => setSelectedRole(role.id)}
            className={cn(
              'rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              selectedRole === role.id
                ? 'bg-primary text-primary-foreground shadow-md scale-[1.03]'
                : 'bg-card border border-border text-foreground hover:border-primary/40 hover:bg-muted',
            )}
          >
            {labels.roles[role.labelKey]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-border">
        {isFreRole ? (
          /* ----------------------------------------------------------------
             Free-role table: 2 columns (Feature | Availability)
          ---------------------------------------------------------------- */
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="py-4 pe-4 ps-6 text-start text-foreground font-bold">
                  {labels.freeRoleTable.feature}
                </th>
                <th className="py-4 px-6 text-center font-bold text-foreground w-48">
                  <span className="inline-flex items-center gap-2">
                    {labels.freeRoleTable.availability}
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                      {labels.freeForever}
                    </span>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {freeSections.map((section) => (
                <Fragment key={section.title}>
                  <tr>
                    <td
                      colSpan={2}
                      className="pt-6 pb-2 ps-6 text-sm font-bold text-primary"
                    >
                      {section.title}
                    </td>
                  </tr>
                  {section.features.map((feature) => (
                    <tr
                      key={feature.label}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 ps-6 pe-4 text-muted-foreground">
                        {feature.label}
                      </td>
                      <td className="py-3 px-6 text-center">
                        <FreeFeatureCell value={feature.value} />
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        ) : (
          /* ----------------------------------------------------------------
             Tiered table: 5 columns (Feature | Starter | Pro | Business | Enterprise)
          ---------------------------------------------------------------- */
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="py-4 pe-4 ps-6 text-start text-foreground font-bold">
                  {labels.freeRoleTable.feature}
                </th>
                {tiers.map((tier) => (
                  <th
                    key={tier.id}
                    className={cn(
                      'py-4 px-4 text-center font-bold',
                      tier.highlighted ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    {tier.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tieredSections.map((section) => (
                <Fragment key={section.title}>
                  <tr>
                    <td
                      colSpan={5}
                      className="pt-6 pb-2 ps-6 text-sm font-bold text-primary"
                    >
                      {section.title}
                    </td>
                  </tr>
                  {section.features.map((feature) => (
                    <tr
                      key={feature.label}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 ps-6 pe-4 text-muted-foreground">
                        {feature.label}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <TieredFeatureCell value={feature.starter} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <TieredFeatureCell value={feature.pro} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <TieredFeatureCell value={feature.business} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <TieredFeatureCell value={feature.enterprise} />
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
