import numpy as np
import geopandas as gpd
from shapely.geometry import Polygon
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')


def create_graph(shapefile):
    """
    Create a graph from a shapefile.
    """
    n = len(shapefile)
    adj = np.zeros((n, n))
    polygons = shapefile.geometry
    for i in range(n):
        for j in range(n):
            if i != j:
                if polygons[i].intersects(polygons[j]):
                    adj[i, j] = 1
                    adj[j, i] = 1
    return adj
    



if __name__ == "__main__":
    shapefile = gpd.read_file("data/LAYER_DISTRITO/sp.shp")
    create_graph(shapefile)
