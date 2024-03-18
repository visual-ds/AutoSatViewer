import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset

class EncoderConv(nn.Module):
    def __init__(self, input_dim, encoding_dim, seq_len, h_dims, h_activ):
        super().__init__()
        self.conv_layers = []
        self.conv1 = nn.Conv1d(
            in_channels=input_dim,
            out_channels=h_dims[0],
            kernel_size=3,
            stride=1,
            padding = 1,
        )
        self.conv2 = nn.Conv1d(
            in_channels=h_dims[0],
            out_channels=h_dims[1],
            kernel_size=3,
            stride=1,
            padding = 1,
        )
        self.fc = nn.Linear(
            in_features = h_dims[1] * (seq_len // 2 // 2),
            out_features = encoding_dim
        )

        self.pool = nn.MaxPool1d(2, stride=2)
        self.activation = h_activ

    def forward(self, x):
        x = self.conv1(x)
        x = self.pool(x)
        x = self.activation(x)
        x = self.conv2(x)
        x = self.pool(x)
        x = self.activation(x)
        x = x.view(x.size(0), -1)
        x = self.fc(x)
        return x
    
class DecoderConv(nn.Module):
    def __init__(self, encoding_dim, output_dim, seq_len, h_dims, h_activ, out_activ):
        super().__init__()
        self.h_dims = h_dims
        self.fc = nn.Linear(
            in_features=encoding_dim,
            out_features=h_dims[1] * (seq_len // 2 // 2)
        )

        self.deconv2 = nn.ConvTranspose1d(
            in_channels=h_dims[1],
            out_channels=h_dims[0],
            kernel_size=3,
            stride=1,
            padding=1
        )

        self.deconv1 = nn.ConvTranspose1d(
            in_channels=h_dims[0],
            out_channels=output_dim,
            kernel_size=3,
            stride=1,
            padding=1
        )

        self.activation = h_activ
        self.out_activ = out_activ
        self.upsample = nn.Upsample(scale_factor=2, mode='nearest')
        self.upsample2 = nn.Upsample(size = seq_len, mode='nearest')


    def forward(self, x):
        x = self.fc(x)
        x = x.view(x.size(0), self.h_dims[1], -1)
        x = self.deconv2(x)
        x = self.activation(x)
        x = self.upsample(x)
        x = self.deconv1(x)
        x = self.upsample2(x)
        x = self.out_activ(x)
        return x

class AutoencoderConv(nn.Module):
    def __init__(self, input_dim, encoding_dim, seq_len, h_dims, h_activ, out_activ):
        super().__init__()
        self.input_dim = input_dim
        self.encoding_dim = encoding_dim
        self.seq_len = seq_len
        self.h_dims = h_dims
        self.h_activ = h_activ
        self.out_activ = out_activ

        self.encoder = EncoderConv(
            input_dim=input_dim,
            encoding_dim=encoding_dim,
            seq_len = seq_len,
            h_dims=h_dims,
            h_activ=h_activ
        )

        self.decoder = DecoderConv(
            encoding_dim=encoding_dim,
            output_dim=input_dim,
            seq_len = seq_len,
            h_dims=h_dims,
            h_activ=h_activ,
            out_activ=out_activ
        )

    def forward(self, x):
        x = self.encoder(x)
        x = self.decoder(x)
        return x
    

def train_model(model, train_loader, val_loader, args, verbose = True):
    model = model.to(args.device)
    criterion = nn.L1Loss()
    optimizer = torch.optim.Adam(model.parameters(), lr=args.lr)
    train_losses = []
    val_losses = []
    for epoch in range(args.epoch):
        train_loss = 0
        for inputs in train_loader:
            inputs = inputs.to(args.device)
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, inputs)
            loss.backward()
            optimizer.step()
            train_loss += loss.item()
        train_loss /= len(train_loader)
        train_losses.append(train_loss)

        if verbose:
            print(f'Epoch {epoch}, Train Loss: {train_loss}')

        if epoch % 10 == 0:
            val_loss = 0
            for inputs in val_loader:
                inputs = inputs.to(args.device)
                outputs = model(inputs)
                loss = criterion(outputs, inputs)
                val_loss += loss.item()
            val_loss /= len(val_loader)
            val_losses.append(val_loss)

            if verbose:
                print(f'Epoch {epoch} Val Loss: {val_loss}')

        if len(val_losses) > 2 and val_losses[-1] > val_losses[-2]:
            break

    return train_losses, val_losses

def get_encodings(model, data_loader, args):
    model = model.to(args.device)
    encodings = []
    for inputs in data_loader:
        inputs = inputs.to(args.device)
        outputs = model.encoder(inputs)
        encodings.append(outputs.detach().cpu().numpy())
    encodings = np.concatenate(encodings, axis=0)
    return encodings

def get_decodings(model, data_loader, args):
    model = model.to(args.device)
    decodings = []
    for inputs in data_loader:
        inputs = inputs.to(args.device)
        outputs = model(inputs)
        decodings.append(outputs.detach().cpu().numpy())
    decodings = np.concatenate(decodings, axis=0)
    return decodings

def testing():
    samples = [torch.rand(6, 45) for i in range(1)]
    train_data = DataLoader(samples[:1], batch_size=32, shuffle=True)
    val_data = DataLoader(samples[:1], batch_size=32, shuffle=True)

    model = AutoencoderConv(
        input_dim = 6,
        encoding_dim=6,
        seq_len = 45,
        h_dims = [16, 32],
        h_activ = nn.ReLU(),
        out_activ = nn.Sigmoid()
    )

    args = {
        "device": "cuda" if torch.cuda.is_available() else "cpu",
        "lr": 0.001,
        "epoch": 100
    }

    train_loss, val_loss = train_model(
        model=model,
        train_loader=train_data,
        val_loader=val_data,
        args=args
    )
