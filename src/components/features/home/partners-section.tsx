import { Link } from '@/i18n/navigation';
import { FadeIn } from '@/components/ui/motion';
import { Marquee } from '@/components/ui/marquee';
import { getTranslations, getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { getLocaleField, getEntitySlug } from '@/lib/utils';
import { UserAvatar } from '@/components/features/user-avatar';

/* ==========================================================================
   PartnersSection — Real verified partners from the database
   ========================================================================== */

type PartnerData = {
  id: string;
  company_name_ar: string | null;
  company_name_en: string | null;
  full_name: string;
  logo_url: string | null;
  avatar_url: string | null;
  slug_ar: string | null;
  slug_en: string | null;
}

function PartnerCard({
  partner,
  locale,
}: {
  partner: PartnerData;
  locale: string;
}) {
  const name = getLocaleField(partner, 'company_name', locale) || partner.full_name;
  const slug = getEntitySlug(partner, locale);
  const imageUrl = partner.logo_url || partner.avatar_url;

  return (
    <Link
      href={`/partners/${slug || partner.id}`}
      className="flex shrink-0 items-center gap-3 rounded-xl border border-border/50 bg-card px-6 py-4 transition-all duration-300 hover:border-primary/30 hover:shadow-md"
    >
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
        <UserAvatar
          src={imageUrl}
          name={name}
          size="md"
        />
      </div>
      <span className="whitespace-nowrap text-sm font-semibold text-foreground">
        {name}
      </span>
    </Link>
  );
}

export async function PartnersSection() {
  const t = await getTranslations('home.partners');
  const locale = await getLocale();
  const supabase = await createClient();

  const { data: partners } = await supabase
    .from('profiles')
    .select('id, company_name_ar, company_name_en, full_name, logo_url, avatar_url, slug_ar, slug_en')
    .in('role', ['contractor', 'supplier'])
    .eq('verification_status', 'active')
    .order('created_at', { ascending: false })
    .limit(20);

  if (!partners || partners.length === 0) return null;

  // Split into two rows
  const firstHalf = partners.slice(0, Math.ceil(partners.length / 2));
  const secondHalf = partners.slice(Math.ceil(partners.length / 2));

  return (
    <section className="py-20 bg-muted/20 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section heading */}
        <FadeIn direction="up" className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
            {t('title')}
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            {t('subtitle')}
          </p>
        </FadeIn>
      </div>

      {/* Row 1 — scrolls in default direction */}
      <FadeIn direction="up" delay={0.2}>
        <Marquee pauseOnHover className="[--duration:35s]">
          {firstHalf.map((p) => (
            <PartnerCard key={p.id} partner={p} locale={locale} />
          ))}
        </Marquee>
      </FadeIn>

      {/* Row 2 — scrolls in reverse direction */}
      {secondHalf.length > 0 && (
        <FadeIn direction="up" delay={0.3}>
          <Marquee reverse pauseOnHover className="mt-4 [--duration:40s]">
            {secondHalf.map((p) => (
              <PartnerCard key={p.id} partner={p} locale={locale} />
            ))}
          </Marquee>
        </FadeIn>
      )}
    </section>
  );
}
