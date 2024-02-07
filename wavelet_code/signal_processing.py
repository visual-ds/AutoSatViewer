import numpy as np
import pandas as pd
from scipy.signal import argrelextrema
from scipy.stats import rankdata
from sklearn.preprocessing import RobustScaler, StandardScaler
from sklearn.cluster import DBSCAN
import networkx as nx

from wavelet_transform import *


def cluster_dominant_feature(
    coefficients, threshold_method="quantile", threshold_value=0.85, normalize=False
):
    """
    Identify the dominant scale from the Wavelet coefficients.
    Set a threshold based on the observed values to identify vectors without dominant scale.

    Inputs:
        coefficients: [n, n_timesteps, n_s] array Wavelet coefficients
        threshold_quantile: float Quantile to set the threshold
        normalize - if should normalize each scale of coefficients

    Outputs:
        dominant_scale: [n, n_timesteps] array Dominant scale
    """
    coefficients = coefficients.copy()
    coefficients = np.abs(coefficients)
    n_s = coefficients.shape[2]

    if normalize:
        for i in range(coefficients.shape[2]):
            coeffs_max = coefficients[:, :, i].max()
            coeffs_min = coefficients[:, :, i].min()
            coefficients[:, :, i] = (coefficients[:, :, i] - coeffs_min) / (
                coeffs_max - coeffs_min
            )

    if threshold_method == "quantile":
        for i in range(coefficients.shape[2]):
            threshold = np.quantile(coefficients[:, :, i], threshold_value)
            coefficients[:, :, i][coefficients[:, :, i] < threshold] = 0
    elif threshold_method == "value":
        for i in range(coefficients.shape[2]):
            coefficients[:, :, i][coefficients[:, :, i] < threshold_value[i]] = 0
    else:
        raise ValueError("Unknown threshold method")

    labels = np.zeros((coefficients.shape[0], coefficients.shape[1]))
    for i in range(coefficients.shape[0]):
        for j in range(coefficients.shape[1]):
            dominant_idx = np.where(coefficients[i, j, :] > 0)[0]
            # if there is no dominant, skip
            if len(dominant_idx) == 0:
                continue
            # if there is only one dominant, take it
            elif len(dominant_idx) == 1:
                labels[i, j] = dominant_idx[0] + 1
            # if there is multiple dominant, check if the distance between them is at max 1
            elif max(np.diff(dominant_idx)) > 1:
                continue
            # otherwise take the dominant with the highest value"
            else:
                labels[i, j] = np.argmax(coefficients[i, j, :]) + 1

    labels_fixed = labels.copy()
    labels_fixed[labels == 1] = -2
    labels_fixed[labels == 2] = -1
    labels_fixed[labels == 3] = 1
    labels_fixed[labels == 4] = 2
    labels = labels_fixed

    return labels


def soft_threshold_coefficients(coefficients, threshold):
    if isinstance(threshold, float):
        clean_coefficients = np.where(
            np.abs(coefficients) > threshold, np.abs(coefficients) - threshold, 0
        )
        clean_coefficients = clean_coefficients * np.sign(coefficients)
    else:
        clean_coefficients = np.zeros(coefficients.shape)
        for i, t in enumerate(threshold):
            clean_coefficients[:, :, i] = np.where(
                np.abs(coefficients[:, :, i]) > t, np.abs(coefficients[:, :, i]) - t, 0
            )
            clean_coefficients[:, :, i] = clean_coefficients[:, :, i] * np.sign(
                coefficients[:, :, i]
            )
    return clean_coefficients


def universal_threshold(coefficients):
    """Threshold from VisuShrink"""
    M = coefficients.shape[0] * coefficients.shape[1]
    sigmas = []
    for i in range(coefficients.shape[2]):
        sigmas.append((np.median(np.abs(coefficients[:, :, i])) / 0.6745) ** 2)
    sigmas = np.array(sigmas)
    thresholds = np.sqrt(2 * np.log(M)) * sigmas
    return thresholds


def sure_threshold(coefficients, thresholds=None):
    if thresholds is None:
        thresholds = np.logspace(1e-6, 1e6, 10)

    sigma = ...
    sure_list = []
    erisk_list = []
    dof_list = []
    for t in thresholds:
        clean_coefficients = soft_threshold_coefficients(coefficients, t)
        erisk_list.append(np.sum((clean_coefficients - coefficients) ** 2))
        dof_list.append(np.sum(np.abs(clean_coefficients) > 0))

    sure_list = np.array(erisk_list) + np.array(dof_list) * sigma**2
    best_threshold = thresholds[np.argmin(sure_list)]
    return best_threshold


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


def dominant_label_time(labels, signal=None):
    """
    Compute the frequency of labels in each timestep and normalize them.
    After, identify the most frequent label in each timestep.
    If the signal is provided, identify the sign of the signal of the most frequent label in each timestep.

    Inputs:
        labels - [n, n_t] array with labels

    Outputs:
        dominant - [n_t] array with dominant labels
        signal_dominant - [n_t] array with dominant labels signal
    """
    unique_labels = np.unique(labels.reshape(-1))
    max_count = []
    for l in unique_labels:
        max_count.append(np.sum(labels == l, axis=0).max())

    dominant = np.zeros(labels.shape[1])
    for t in range(labels.shape[1]):
        count = []
        for j, l in enumerate(unique_labels):
            count.append(np.sum(labels[:, t] == l))
        count = np.array(count)
        dominant[t] = unique_labels[
            np.argmax([c / m for (c, m) in zip(count, max_count)])
        ]

    if not signal is None:
        signal_dominant = np.zeros(signal.shape[1])
        for t in range(signal.shape[1]):
            dominant_label = dominant[t]
            filtered_signal = signal[labels[:, t] == dominant_label, t]
            positive_count = np.sum(filtered_signal > 0)
            negative_count = np.sum(filtered_signal < 0)
            if positive_count > negative_count:
                signal_dominant[t] = 1
            else:
                signal_dominant[t] = -1

        return dominant, signal_dominant

    return dominant


def haversine(lon1, lat1, lon2, lat2):
    lon1, lat1, lon2, lat2 = (
        np.radians(lon1),
        np.radians(lat1),
        np.radians(lon2),
        np.radians(lat2),
    )
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = np.sin(dlat / 2.0) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2.0) ** 2
    return 6367 * 2 * np.arcsin(np.sqrt(a))

