import pandas as pd
import json
from datetime import datetime


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
                          'publisher', 'platforms', 'genres', 'steamspy_tags',
                          'positive_ratings', 'negative_ratings',
                          'price'])
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

# Network data
network_data = dict()
for _, game in data.iterrows():
    for genre in game.genres.split(';'):
        if genre in network_data:
            network_data[genre]['count'] += 1
        else:
            network_data[genre] = {'count': 1, 'dates': dict()}
        game_year = str(
            datetime.strptime(game.release_date, '%Y-%m-%d').date().year)
        if game_year in network_data[genre]['dates']:
            network_data[genre]['dates'][game_year]['count'] += 1
        else:
            network_data[genre]['dates'][game_year] = \
                {'count': 1, 'tags': dict()}
        for tag in game.steamspy_tags.split(';'):
            if tag in network_data[genre]['dates'][game_year]['tags']:
                network_data[genre]['dates'][game_year]['tags'][tag] += 1
            else:
                network_data[genre]['dates'][game_year]['tags'][tag] = 1
with open('results/network.json', 'w') as file:
    json.dump(network_data, file)
