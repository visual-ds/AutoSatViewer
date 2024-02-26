import numpy as np
import pandas as pd
from scipy.signal import argrelextrema
from scipy.stats import rankdata
from sklearn.preprocessing import RobustScaler, StandardScaler
from sklearn.cluster import DBSCAN
import networkx as nx

from wavelet_transform import *


def get_scaled_coefficients(coefficients, scales=None):
    # scale coefficients
    n = coefficients.shape[0]
    n_t = coefficients.shape[1]
    n_s = coefficients.shape[2]

    scaled_coefficients = np.abs(coefficients.reshape((-1, n_s)))
    if scales is None:
        scaler = RobustScaler(with_centering=False)
        scaler.fit(scaled_coefficients)
        if (
            scaler.scale_ == 1
        ).any():  # if there is some scale with the quantiles equal
            scaler = StandardScaler(with_mean=False)
            scaler.fit(scaled_coefficients)
        scaled_coefficients = scaler.transform(scaled_coefficients)
    else:
        for i in range(n_s):
            scaled_coefficients[:, i] = scaled_coefficients[:, i] * scales[i]

    # if is all zero, return
    if scaled_coefficients.max() == 0:
        return scaled_coefficients.reshape((n, n_t, n_s))
    
    for i in range(n_s):
        scale_max = np.nanmax(scaled_coefficients[:, i])
        scaled_coefficients[:, i] = np.log(scaled_coefficients[:, i] + 1) / np.log(
            scale_max + 1
        )

    return scaled_coefficients.reshape((n, n_t, n_s))


def get_torque(coefficients, scales=None, weights = None):
    """
    Clustering of wavelets with a normalization step and a modelling of coefficients
    as a torque. Based on the paper Wavelet-based Visual Analysis of Dynamic Networks.

    Inputs:
        coefficients: [n, n_t, n_s] Wavelet coefficients

    Outputs:
        torque: [n, n_t] torque
    """

    n = coefficients.shape[0]
    n_t = coefficients.shape[1]
    n_s = coefficients.shape[2]

    scaled_coefficients = get_scaled_coefficients(coefficients, scales).reshape(
        (-1, n_s)
    )

    # compute torque
    if weights is None:
        if n_s % 2 != 0:
            weights = np.arange(-n_s // 2 + 1, n_s // 2 + 1)
        else:
            weights = np.concatenate([np.arange(-n_s // 2, 0), np.arange(1, n_s // 2 + 1)])
    sum_weights = sum([w for w in weights if w > 0])

    assert scaled_coefficients.shape[1] == weights.shape[0]
    for i in range(scaled_coefficients.shape[1]):
        scaled_coefficients[:, i] *= weights[i] / sum_weights

    scaled_coefficients = scaled_coefficients.reshape((n, n_t, n_s))
    torque = scaled_coefficients.sum(axis=2)

    return torque


def cluster_torque(
    coefficients, scales=None, threshold_method="quantiles"
):
    """
    Clustering of wavelets with a normalization step and a modelling of coefficients
    as a torque. Based on the paper Wavelet-based Visual Analysis of Dynamic Networks.

    Inputs:
        coefficients: [n, n_t, n_s] Wavelet coefficients

    Outputs:
        labels: [n] cluster labels
    """
    n, n_t, n_s = coefficients.shape
    torque = get_torque(coefficients, scales).reshape(-1)
    min_torque, max_torque = np.nanmin(torque), np.nanmax(torque)
    labels = np.zeros(torque.shape[0])
    torque_less_zero = torque < 0
    torque_bigger_zero = torque >= 0

    if threshold_method == "quantiles":
        intervals = [
            min_torque - 1,
            np.quantile(torque[torque_less_zero], 0.1),
            np.quantile(torque[torque_less_zero], 0.3),
            np.quantile(torque[torque_bigger_zero], 0.6),
            np.quantile(torque[torque_bigger_zero], 0.9),
            max_torque + 1,
        ]
    elif threshold_method == "values_mine":
        intervals = [
            -np.inf,
            -0.3,
            -0.125,
            0.125,
            0.3,
            np.inf,
        ]
    elif threshold_method == "values_paper":
        intervals = [
            -np.inf,
            -0.3,
            -0.05,
            0.05,
            0.3,
            np.inf,
        ]
    elif threshold_method == "linear_paper":
        torque_min = np.nanmin(torque)
        torque_max = np.nanmax(torque)
        intervals = np.linspace(torque_min, torque_max * 1.001, 6)

    for i in range(len(intervals) - 1):
        labels[(torque >= intervals[i]) & (torque < intervals[i + 1])] = i - 2

    labels[np.isnan(torque)] = -77

    return labels.reshape((n, n_t))


def wavelet_energy(coefficients):
    """
    Compute the energy density of the wavelet coefficients.
    The energy density is the integral of the absolute squared wavelet coefficients along the scales.
    As we are using the discrete wavelet transform, the integral is approximated by the sum.

    Inputs:
        coefficients: [n, n_t, n_s] Wavelet coefficients

    Outputs:
        energy: [n, n_t] Energy density
    """
    energy = np.abs(coefficients) ** 2
    energy = energy.sum(axis=2)
    return energy


def wavelet_maxima_energy(coefficients, scales):
    """
    Compute the energy density of the wavelet coefficients.
    The energy density is the integral of the absolute squared wavelet coefficients along the scales.
    As we are using the discrete wavelet transform, the integral is approximated by the sum.

    Inputs:
        coefficients: [n, n_t, n_s] Wavelet coefficients

    Outputs:
        maximum_energy: [n, n_t] Energy density
    """
    energy = np.abs(coefficients[:, :, :]) ** 2
    maximum_idx = argrelextrema(energy, np.greater, axis=2)
    maximum_energy = np.zeros((energy.shape[0], energy.shape[1]))

    for i in range(len(maximum_idx[0])):
        x, t, s_i = maximum_idx[0][i], maximum_idx[1][i], maximum_idx[2][i]
        s = 1 / (2 * np.pi * scales[s_i])
        maximum_energy[x, t] = energy[x, t, s_i] * s

    return maximum_energy


def wavelet_power_spectrum(coefficients):
    """
    Compute the power spectrum of the wavelet coefficients.
    The power spectrum is the integral of the absolute squared wavelet coefficients along the time.
    As we are using the discrete wavelet transform, the integral is approximated by the sum.

    Inputs:
        coefficients: [n, n_t, n_s] Wavelet coefficients

    Outputs:
        energy: [n, n_t] Energy density
    """
    power = np.abs(coefficients) ** 2
    power = power.sum(axis=1)
    return power
