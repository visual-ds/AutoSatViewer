import numpy as np
from tqdm import tqdm
import geopandas as gpd
from shapely.geometry import Polygon
from sklearn.neighbors import NearestNeighbors
import matplotlib.pyplot as plt
import matplotlib

matplotlib.use("Agg")


def create_graph(shapefile):
    """
    Create a graph from a shapefile.
    """
    n = len(shapefile)
    adj = np.zeros((n, n))
    polygons = shapefile.geometry
    centers = np.array([polygon.centroid.coords for polygon in polygons]).reshape(n, 2)
    nbrs = NearestNeighbors(n_neighbors=30, algorithm="ball_tree").fit(centers)
    distances, indices = nbrs.kneighbors(centers)

    for i in tqdm(range(n)):
        for j in indices[i]:
            if i != j:
                if polygons[i].intersects(polygons[j]):
                    adj[i, j] = 1
                    adj[j, i] = 1
    return adj


if __name__ == "__main__":
    shapefile = gpd.read_file("data/LAYER_DISTRITO/sp.shp")
    create_graph(shapefile)
