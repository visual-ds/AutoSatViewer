# Copyright (c) 2022 Giovani de Almeida Valdrighi

# Permission is hereby granted, free of charge, to any person obtaining a
# copy of this software and associated documentation files (the "Software"),
# to deal in the Software without restriction, including without limitation
# the rights to use, copy, modify, merge, publish, distribute, sublicense,
# and/or sell copies of the Software, and to permit persons to whom the
# Software is furnished to do so, subject to the following conditions:

# The above copyright notice and this permission notice shall be included
# in all copies or substantial portions of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
# ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
# TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
# PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT
# SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR
# ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
# ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE
# OR OTHER DEALINGS IN THE SOFTWARE.

"""
My implementation of signal processing in graphs with wavelets transforms.
Based on the implementation of the library PyGSP.
"""

import numpy as np
from pygsp import graphs, filters
from tqdm import tqdm
from scipy.optimize import fminbound
from scipy.sparse import csr_matrix


def get_spatiotemporal_adj(adjancency_matrix, n_timestamps, graph_product="cartesian"):
    if type(adjancency_matrix) == csr_matrix:
        x, y = adjancency_matrix.nonzero()
    else:
        x, y = np.where(adjancency_matrix)
    e = []
    nodes = np.arange(adjancency_matrix.shape[0])
    n_nodes = adjancency_matrix.shape[0]
    if graph_product == "cartesian":
        for t in range(n_timestamps):  # link between nodes in the same timestamp
            e.append(np.array([x + t * n_nodes, y + t * n_nodes]).T)
        for t in range(1, n_timestamps):
            e.append(np.array([nodes + t * n_nodes, nodes + (t - 1) * n_nodes]).T)
            e.append(np.array([nodes + (t - 1) * n_nodes, nodes + t * n_nodes]).T)

    elif graph_product == "strong":
        for t in range(n_timestamps):  # link between nodes in the same timestamp
            e.append(np.array([x + t * n_nodes, y + t * n_nodes]).T)
        for t in range(1, n_timestamps):
            e.append(np.array([nodes + t * n_nodes, nodes + (t - 1) * n_nodes]).T)
            e.append(np.array([nodes + (t - 1) * n_nodes, nodes + t * n_nodes]).T)
            e.append(np.array([x + (t - 1) * n_nodes, y + t * n_nodes]).T)
            e.append(np.array([y + t * n_nodes, x + (t - 1) * n_nodes]).T)

    e = np.concatenate(e)
    adjancency_matrix_temporal = csr_matrix(
        (np.ones(e.shape[0]), (e[:, 0], e[:, 1])),
        shape=(
            n_timestamps * adjancency_matrix.shape[0],
            n_timestamps * adjancency_matrix.shape[0],
        ),
    )
    return adjancency_matrix_temporal


class SpatioTemporalGraph:
    def __init__(self, G, H, method="exact_low_memory"):
        assert method in ["exact_fast", "exact_low_memory"]
        self.method = method
        self.G_e = G.e
        self.G_U = G.U
        self.H_e = H.e
        self.H_U = H.U
        self.n_vertex = G.N
        self.n_timestamps = H.N

        self.e = (np.expand_dims(G.e, 0) + np.expand_dims(H.e, 1)).reshape(-1)

        if method == "exact_fast":
            self.U = np.zeros(
                (self.n_vertex * self.n_timestamps, self.n_vertex * self.n_timestamps)
            )
            for i in range(self.n_vertex):
                for t in range(self.n_timestamps):
                    self.U[:, i + t * self.n_vertex] = np.kron(
                        self.H_U[:, t], self.G_U[:, i]
                    )

    def gft(self, signal):
        if self.method == "exact_fast":
            signal = np.expand_dims(signal, axis=2)
            signal_hat = np.tensordot(self.U, signal, ([0], [0]))
            signal_hat = signal_hat.squeeze(2)

        elif self.method == "exact_low_memory":
            signal_hat = np.zeros(signal.shape)
            for i in range(self.n_vertex):
                for t in range(self.n_timestamps):
                    signal_hat[i + t * self.n_vertex, :] = np.dot(
                        np.kron(self.H_U[:, t], self.G_U[:, i]), signal
                    )

        return signal_hat

    def igft(self, signal_hat):
        if self.method == "exact_fast":
            signal = np.tensordot(self.U, signal_hat, ([1], [0]))
        elif self.method == "exact_low_memory":
            signal = np.zeros(signal_hat.shape)
            for i in range(self.n_vertex):
                for t in range(self.n_timestamps):
                    signal += (
                        np.kron(self.H_U[:, t], self.G_U[:, i])[:, None]
                        * signal_hat[i + t * self.n_vertex, None, :]
                    )

        return signal


class Wavelet:
    """
    Class that build the Wavelet filters, and with a Graph_3D, perform the filtering
    on the Fourier space.
    """

    def __init__(
        self,
        G,
        n_filters,
        kernel="abspline",
        scaling_function=True,
        method="exact_low_memory",
        order_chebyshev=30,
    ):
        self.G = G
        self.n_filters = n_filters
        self.kernel = kernel
        self.scaling_function = scaling_function
        self.method = method
        self.order_chebyshev = order_chebyshev

        if method.startswith("exact"):
            if kernel == "mexican_hat":
                self.mexican_hat()
            else:
                self.abspline()
        else:
            if kernel == "mexican_hat":
                self.wavelet_pygsp = filters.MexicanHat(G, self.n_filters)
            else:
                self.wavelet_pygsp = filters.Abspline(G, self.n_filters)

            self.kernels = self.wavelet_pygsp._kernels

    def get_scales(self, K=20, x_1=1, x_2=2):
        """
        Get logarithmically spaced scales between min and max eigenvalues.
        """
        eigenvalue_max = np.max(self.G.e) * 1.00001
        eigenvalue_min = eigenvalue_max / K

        t_1 = x_2 / eigenvalue_min
        t_J = x_1 / eigenvalue_max

        n_filters = self.n_filters - 1 if self.scaling_function else self.n_filters
        # logarithmic sampled
        scales = np.exp(np.linspace(np.log(t_1), np.log(t_J), n_filters))

        return scales

    def mexican_hat(self):
        """
        Mexican hat kernels defined based on the PyGSP implementation.
        """

        eigenvalue_max = np.max(self.G.e) * 1.01
        eigenvalue_min = eigenvalue_max / 20

        self.scales = self.get_scales()

        band_pass = lambda x: x * np.exp(-x)

        def low_pass(x):
            return np.exp(-(x**4))

        self.kernels = []
        if self.scaling_function:
            self.kernels.append(
                lambda x: 1.2 * np.exp(-1) * low_pass(x / 0.4 / eigenvalue_min)
            )

        for i in range(self.n_filters - len(self.kernels)):

            def kernel(x, i=i):
                return band_pass(self.scales[i] * x)

            self.kernels.append(kernel)

    def abspline(self):
        """ """
        K = 20
        alpha = 2
        beta = 2
        x_1 = 1
        x_2 = 2

        eigenvalue_max = np.max(self.G.e) * 1.0001
        eigenvalue_min = eigenvalue_max / K

        self.scales = self.get_scales(K, x_1, x_2)

        # g function
        def band_pass(x):
            if type(x) != np.array:
                x = np.array(x)

            bool1 = x < x_1
            bool2 = (x_1 <= x) & (x <= x_2)
            bool3 = x_2 < x

            x[bool1] = x[bool1] ** alpha * x_1 ** (-alpha)
            x[bool2] = -5 + 11 * x[bool2] - 6 * x[bool2] ** 2 + x[bool2] ** 3
            x[bool3] = x[bool3] ** (-beta) * x_2**beta
            return x

        # max of other kernels
        x_argmax = fminbound(lambda x: -band_pass(x), x_1, x_2)
        gamma = band_pass(x_argmax)

        self.kernels = []
        if self.scaling_function:
            self.kernels.append(
                lambda x: gamma * np.exp(-((x / (0.6 * eigenvalue_min)) ** 4))
            )

        # kernels
        for i in range(self.n_filters - len(self.kernels)):

            def kernel(x, i=i):
                return band_pass(x * self.scales[i])

            self.kernels.append(kernel)

    def evaluate(self, x):
        """
        Evaluate the wavelet filters at the given points.
        """
        y = np.empty((self.n_filters, x.shape[0]))
        for i, kernel in enumerate(self.kernels):
            y[i, :] = kernel(x)
        return y

    def evaluate_inverse(self, x):
        y = np.empty((self.n_filters, x.shape[0]))
        for i, kernel in enumerate(self.invert_kernels):
            y[i, :] = kernel(x)
        return y

    def filter(self, signal):
        """
        Apply the filter on the signal at the Fourier Space.
        """

        if self.method.startswith("exact"):
            f = self.evaluate(self.G.e).T  # pass eigenvalues trought kernel
            f = np.expand_dims(f, axis=1)
            signal_hat = self.G.gft(signal)  # transform the signal to frequency domain
            signal_hat = np.expand_dims(signal_hat, axis=2)
            coefficients_hat = np.matmul(signal_hat, f).squeeze(1)  # multiply
            coefficients = self.G.igft(coefficients_hat)  # return to original domain

        elif self.method == "chebyshev":
            coefficients = self.wavelet_pygsp.filter(
                signal, method="chebyshev", order=self.order_chebyshev
            )

        return coefficients

    def invert(self, coefficients):
        if self.method.startswith("exact"):
            f = self.evaluate(self.G.e).T
            pseudo_inverse = np.linalg.pinv(np.expand_dims(f, axis=-1)).squeeze(axis=-2)
            pseudo_inverse = np.expand_dims(pseudo_inverse, axis=2)
            coefficients_hat = self.G.gft(coefficients)
            coefficients_hat = np.expand_dims(coefficients_hat, axis=1)
            signal_hat = np.matmul(coefficients_hat, pseudo_inverse).squeeze(axis=1)
            signal = self.G.igft(signal_hat)
        elif self.method == "chebyshev":
            raise NotImplementedError
        return signal


class WaveletTransform:
    """
    Wavelet transform for signals defined on graphs.

    Inputs:
        adj_matrix - np.array, adjacency matrix of the graph
        n_timestamps - int, number of timestamps
        G_H - graphs.Graph, provided graph, if None, the graph is defined by stacking the adjacency matrix
        graph_product - string, method of which the graph is defined, must be ["cartesian", "strong"]
        n_filters - int, number of filters
        kernel - string, kernel type, must be ["abspline", "mexican_hat"]
        scaling_function - bool, whether to use scaling function
        method - string, method to compute the transform, must be ["exact_fast", "exact_low_memory", "chebyshev"], if "exact" graph_product must be "cartesian"
        order_chebyshev - int, order of the approximation if method is "chebyshev"
    """

    def __init__(
        self,
        adj_matrix,
        n_timestamps,
        G_H=None,
        graph_product="cartesian",
        n_filters=4,
        kernel="abspline",
        scaling_function=True,
        method="exact_low_memory",
        order_chebyshev=30,
    ):
        self.n_timestamps = n_timestamps
        assert graph_product in ["cartesian", "strong"]
        self.graph_product = graph_product
        self.n_filters = n_filters
        assert kernel in ["abspline", "mexican_hat"]
        self.kernel = kernel
        self.scaling_function = scaling_function
        assert method in ["exact_fast", "exact_low_memory", "chebyshev"]
        assert not (method.startswith("exact") and graph_product == "strong")
        self.method = method
        self.order_chebyshev = order_chebyshev

        if method.startswith("exact") and G_H is not None:
            raise ValueError(
                "If method is exact, G can not be provided, the graph is defined by the product of the adjacency matrix"
            )
        if method.startswith("exact"):
            # spatial graph
            G = graphs.Graph(adj_matrix)
            G.compute_fourier_basis()
            # linear temporal graph
            H = graphs.Path(self.n_timestamps)
            H.set_coordinates("line1D")
            H.compute_fourier_basis()
            self.G_H = SpatioTemporalGraph(G, H, self.method)

        else:
            if G_H is None:
                if n_timestamps == 1:
                    adj_matrix_temporal = adj_matrix
                else:
                    adj_matrix_temporal = get_spatiotemporal_adj(
                        adj_matrix, n_timestamps, graph_product
                    )
                self.G_H = graphs.Graph(adj_matrix_temporal)
            else:
                self.G_H = G_H
            self.G_H.estimate_lmax()
            if scaling_function is False:
                self.n_filters += 1
        self.wavelet = Wavelet(
            self.G_H,
            self.n_filters,
            self.kernel,
            self.scaling_function,
            self.method,
            self.order_chebyshev,
        )

    def transform(self, signal):
        assert signal.shape[1] == self.n_timestamps
        signal = signal.T.reshape(-1, 1)
        coefficients = self.wavelet.filter(signal)
        coefficients = coefficients.reshape(
            (self.n_timestamps, -1, self.n_filters)
        ).transpose((1, 0, 2))
        if self.method == "chebyshev" and self.scaling_function is False:
            coefficients = coefficients[:, :, 1:]
        return coefficients

    def inverse_transform(self, coefficients):
        pass
