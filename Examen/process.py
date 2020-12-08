import pandas as pd


# Transform rating amount into proportion
def get_ratings_proportion(row):
    positive_ratings = row.positive_ratings
    negative_ratings = row.negative_ratings
    total_ratings = positive_ratings + negative_ratings
    return {'positive': round(positive_ratings * 100 / total_ratings, 1),
            'negative': round(negative_ratings * 100 / total_ratings, 1)}


# Games data
data = pd.read_csv(
    'steam.csv', usecols=['appid', 'name', 'release_date', 'developer',
                          'publisher', 'platforms', 'genres',
                          'positive_ratings', 'negative_ratings', 'price'])
data['price'] = data['price'].apply(lambda x: round(x * 1.34, 2))
data['positive'] = data.apply(
    lambda row: get_ratings_proportion(row)['positive'], axis=1)
data['negative'] = data.apply(
    lambda row: get_ratings_proportion(row)['negative'], axis=1)
data = data.drop(columns=['positive_ratings', 'negative_ratings'])

# Description data
description_data = pd.read_csv(
    'steam_description_data.csv', usecols=['steam_appid', 'short_description'])
data = pd.merge(data, description_data, left_on='appid',
                right_on='steam_appid').drop(columns='appid')

# Image data
media_data = pd.read_csv(
    'steam_media_data.csv', usecols=['steam_appid', 'header_image'])
data = pd.merge(data, media_data, on='steam_appid')

# Requirements data
requirements_data = pd.read_csv(
    'steam_requirements_data.csv', usecols=['steam_appid', 'minimum'])
data = pd.merge(data, requirements_data, on='steam_appid')

data.to_csv('results/steam.csv', index=False)
