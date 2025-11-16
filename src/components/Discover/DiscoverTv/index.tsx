import Button from '@app/components/Common/Button';
import Header from '@app/components/Common/Header';
import ListView from '@app/components/Common/ListView';
import PageTitle from '@app/components/Common/PageTitle';
import Tooltip from '@app/components/Common/Tooltip';
import type { FilterOptions } from '@app/components/Discover/constants';
import {
  countActiveFilters,
  prepareFilterValues,
} from '@app/components/Discover/constants';
import FilterSlideover from '@app/components/Discover/FilterSlideover';
import useDiscover from '@app/hooks/useDiscover';
import { useUser } from '@app/hooks/useUser';
import { useUpdateQueryParams } from '@app/hooks/useUpdateQueryParams';
import Error from '@app/pages/_error';
import defineMessages from '@app/utils/defineMessages';
import { BarsArrowDownIcon, FunnelIcon } from '@heroicons/react/24/solid';
import { EyeSlashIcon } from '@heroicons/react/24/outline';
import type { SortOptions as TMDBSortOptions } from '@server/api/themoviedb';
import type { TvResult } from '@server/models/Search';
import type { UserSettingsGeneralResponse } from '@server/interfaces/api/userSettingsInterfaces';
import { useRouter } from 'next/router';
import { useState, useMemo, useCallback } from 'react';
import { useIntl } from 'react-intl';
import useSWR from 'swr';

const messages = defineMessages('components.Discover.DiscoverTv', {
  discovertv: 'Series',
  activefilters:
    '{count, plural, one {# Active Filter} other {# Active Filters}}',
  sortPopularityAsc: 'Popularity Ascending',
  sortPopularityDesc: 'Popularity Descending',
  sortFirstAirDateAsc: 'First Air Date Ascending',
  sortFirstAirDateDesc: 'First Air Date Descending',
  sortTmdbRatingAsc: 'TMDB Rating Ascending',
  sortTmdbRatingDesc: 'TMDB Rating Descending',
  sortTitleAsc: 'Title (A-Z) Ascending',
  sortTitleDesc: 'Title (Z-A) Descending',
  hideonmyservices: 'Hide on My Services',
  hideonmyservicesTooltip:
    'Hide series available on your subscribed streaming services',
  excludingservices: 'Excluding: {services}',
});

const SortOptions: Record<string, TMDBSortOptions> = {
  PopularityAsc: 'popularity.asc',
  PopularityDesc: 'popularity.desc',
  FirstAirDateAsc: 'first_air_date.asc',
  FirstAirDateDesc: 'first_air_date.desc',
  TmdbRatingAsc: 'vote_average.asc',
  TmdbRatingDesc: 'vote_average.desc',
  TitleAsc: 'original_title.asc',
  TitleDesc: 'original_title.desc',
} as const;

const DiscoverTv = () => {
  const intl = useIntl();
  const router = useRouter();
  const updateQueryParams = useUpdateQueryParams({});
  const { user } = useUser();

  const { data: userSettings } = useSWR<UserSettingsGeneralResponse>(
    user ? `/api/v1/user/${user.id}/settings/main` : null
  );

  const preparedFilters = prepareFilterValues(router.query);

  const {
    isLoadingInitialData,
    isEmpty,
    isLoadingMore,
    isReachingEnd,
    titles,
    fetchMore,
    error,
  } = useDiscover<TvResult, never, FilterOptions>('/api/v1/discover/tv', {
    ...preparedFilters,
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data: watchProviders } = useSWR(
    userSettings?.streamingRegion
      ? `/api/v1/watchproviders/tv?watchRegion=${userSettings.streamingRegion}`
      : null
  );

  const hasSubscribedServices = useMemo(
    () =>
      userSettings?.subscribedWatchProviders &&
      userSettings.subscribedWatchProviders.length > 0,
    [userSettings?.subscribedWatchProviders]
  );

  const hideOnMyServicesActive = useMemo(
    () => !!preparedFilters.withoutWatchProviders,
    [preparedFilters.withoutWatchProviders]
  );

  const excludedServiceNames = useMemo(() => {
    if (!hideOnMyServicesActive || !watchProviders || !userSettings?.subscribedWatchProviders) {
      return '';
    }
    const names = userSettings.subscribedWatchProviders
      .map((id) => {
        const provider = watchProviders.find((p: any) => p.id === id);
        return provider?.name;
      })
      .filter(Boolean);
    return names.slice(0, 3).join(', ') + (names.length > 3 ? '...' : '');
  }, [hideOnMyServicesActive, watchProviders, userSettings?.subscribedWatchProviders]);

  const toggleHideOnMyServices = useCallback(() => {
    if (hideOnMyServicesActive) {
      updateQueryParams('withoutWatchProviders', undefined);
    } else if (hasSubscribedServices) {
      updateQueryParams(
        'withoutWatchProviders',
        userSettings?.subscribedWatchProviders?.join('|')
      );
    }
  }, [
    hideOnMyServicesActive,
    hasSubscribedServices,
    updateQueryParams,
    userSettings?.subscribedWatchProviders,
  ]);

  // Auto-apply filter if user preference is set
  useMemo(() => {
    if (
      userSettings?.hideWatchProvidersOnDiscover &&
      hasSubscribedServices &&
      !hideOnMyServicesActive &&
      !preparedFilters.watchProviders
    ) {
      updateQueryParams(
        'withoutWatchProviders',
        userSettings.subscribedWatchProviders?.join('|')
      );
    }
  }, [
    userSettings?.hideWatchProvidersOnDiscover,
    hasSubscribedServices,
    hideOnMyServicesActive,
    preparedFilters.watchProviders,
    userSettings?.subscribedWatchProviders,
    updateQueryParams,
  ]);

  if (error) {
    return <Error statusCode={500} />;
  }

  const title = intl.formatMessage(messages.discovertv);

  return (
    <>
      <PageTitle title={title} />
      <div className="mb-4 flex flex-col justify-between lg:flex-row lg:items-end">
        <Header>{title}</Header>
        <div className="mt-2 flex flex-grow flex-col sm:flex-row lg:flex-grow-0">
          <div className="mb-2 flex flex-grow sm:mb-0 sm:mr-2 lg:flex-grow-0">
            <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-gray-500 bg-gray-800 px-3 text-gray-100 sm:text-sm">
              <BarsArrowDownIcon className="h-6 w-6" />
            </span>
            <select
              id="sortBy"
              name="sortBy"
              className="rounded-r-only"
              value={preparedFilters.sortBy || SortOptions.PopularityDesc}
              onChange={(e) => updateQueryParams('sortBy', e.target.value)}
            >
              <option value={SortOptions.PopularityDesc}>
                {intl.formatMessage(messages.sortPopularityDesc)}
              </option>
              <option value={SortOptions.PopularityAsc}>
                {intl.formatMessage(messages.sortPopularityAsc)}
              </option>
              <option value={SortOptions.FirstAirDateDesc}>
                {intl.formatMessage(messages.sortFirstAirDateDesc)}
              </option>
              <option value={SortOptions.FirstAirDateAsc}>
                {intl.formatMessage(messages.sortFirstAirDateAsc)}
              </option>
              <option value={SortOptions.TmdbRatingDesc}>
                {intl.formatMessage(messages.sortTmdbRatingDesc)}
              </option>
              <option value={SortOptions.TmdbRatingAsc}>
                {intl.formatMessage(messages.sortTmdbRatingAsc)}
              </option>
              <option value={SortOptions.TitleAsc}>
                {intl.formatMessage(messages.sortTitleAsc)}
              </option>
              <option value={SortOptions.TitleDesc}>
                {intl.formatMessage(messages.sortTitleDesc)}
              </option>
            </select>
          </div>
          <FilterSlideover
            type="tv"
            currentFilters={preparedFilters}
            onClose={() => setShowFilters(false)}
            show={showFilters}
          />
          {hasSubscribedServices && (
            <div className="mb-2 flex flex-grow flex-col sm:mb-0 sm:mr-2 lg:flex-grow-0">
              <Tooltip
                content={intl.formatMessage(messages.hideonmyservicesTooltip)}
              >
                <Button
                  onClick={toggleHideOnMyServices}
                  className="w-full"
                  buttonType={hideOnMyServicesActive ? 'primary' : 'default'}
                >
                  <EyeSlashIcon />
                  <span>{intl.formatMessage(messages.hideonmyservices)}</span>
                </Button>
              </Tooltip>
              {hideOnMyServicesActive && excludedServiceNames && (
                <div className="mt-1 text-xs text-gray-400">
                  {intl.formatMessage(messages.excludingservices, {
                    services: excludedServiceNames,
                  })}
                </div>
              )}
            </div>
          )}
          <div className="mb-2 flex flex-grow sm:mb-0 lg:flex-grow-0">
            <Button onClick={() => setShowFilters(true)} className="w-full">
              <FunnelIcon />
              <span>
                {intl.formatMessage(messages.activefilters, {
                  count: countActiveFilters(preparedFilters),
                })}
              </span>
            </Button>
          </div>
        </div>
      </div>
      <ListView
        items={titles}
        isEmpty={isEmpty}
        isReachingEnd={isReachingEnd}
        isLoading={
          isLoadingInitialData || (isLoadingMore && (titles?.length ?? 0) > 0)
        }
        onScrollBottom={fetchMore}
      />
    </>
  );
};

export default DiscoverTv;
