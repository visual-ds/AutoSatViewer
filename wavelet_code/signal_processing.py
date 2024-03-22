import numpy as np
from sklearn.preprocessing import RobustScaler, StandardScaler


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
