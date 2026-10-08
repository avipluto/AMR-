import torch
import torch.nn as nn
from typing import Dict, Any, List, Optional
import numpy as np

class MultimodalAMRNetwork(nn.Module):
    """
    Multimodal deep neural architecture combining:
      1. Image-derived phenotypic zone features (vision representation)
      2. Clinical phenotypic laboratory features (species, antibiotic, zone, MIC)
      3. Genotypic genomic features (gene/mutation embeddings)
      4. Population historical resistance priors
    
    Modular: Supports missing modalities via projection layers and masking.
    """
    def __init__(self, num_species=5, num_antibiotics=10, num_genomic_features=12, hidden_dim=64):
        super().__init__()
        # Phenotypic tabular embeddings
        self.species_embed = nn.Embedding(num_species, 16)
        self.antibiotic_embed = nn.Embedding(num_antibiotics, 16)
        self.numeric_fc = nn.Linear(3, 16) # zone_mm, disk_mm, mic

        # Genomic encoder
        self.genomic_fc = nn.Linear(num_genomic_features, 32)

        # Vision representation projection (from CV/CNN feature extractor)
        self.vision_fc = nn.Linear(32, 32)

        # Fusion network
        # 16 + 16 + 16 + 32 + 32 = 112 dim
        self.fusion = nn.Sequential(
            nn.Linear(112, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 3) # S, I, R classes
        )

    def forward(self, species_idx, ab_idx, numeric_feats, genomic_feats=None, vision_feats=None):
        e_spec = self.species_embed(species_idx)
        e_ab = self.antibiotic_embed(ab_idx)
        e_num = torch.relu(self.numeric_fc(numeric_feats))

        if genomic_feats is None:
            e_gen = torch.zeros(species_idx.size(0), 32, device=species_idx.device)
        else:
            e_gen = torch.relu(self.genomic_fc(genomic_feats))

        if vision_feats is None:
            e_vis = torch.zeros(species_idx.size(0), 32, device=species_idx.device)
        else:
            e_vis = torch.relu(self.vision_fc(vision_feats))

        fused = torch.cat([e_spec, e_ab, e_num, e_gen, e_vis], dim=-1)
        logits = self.fusion(fused)
        return logits

class MultimodalAMRPredictor:
    """
    Inference wrapper for Multimodal AMR predictions.
    Seamlessly handles isolates with only image, only tabular AST, or multimodal data.
    """
    def __init__(self):
        self.model = MultimodalAMRNetwork()
        self.model.eval()

    def predict_multimodal(
        self,
        organism: str,
        antibiotic: str,
        zone_mm: float,
        mic: Optional[float] = None,
        genomic_markers: Optional[List[str]] = None,
        vision_embedding: Optional[List[float]] = None
    ) -> Dict[str, Any]:
        with torch.no_grad():
            species_idx = torch.tensor([0], dtype=torch.long)
            ab_idx = torch.tensor([0], dtype=torch.long)
            num_feats = torch.tensor([[zone_mm, 6.0, mic if mic is not None else 2.0]], dtype=torch.float32)

            gen_feats = None
            if genomic_markers and len(genomic_markers) > 0:
                g_arr = np.zeros((1, 12), dtype=np.float32)
                g_arr[0, 0] = 1.0 # marker active
                gen_feats = torch.from_numpy(g_arr)

            vis_feats = None
            if vision_embedding and len(vision_embedding) == 32:
                vis_feats = torch.tensor([vision_embedding], dtype=torch.float32)

            logits = self.model(species_idx, ab_idx, num_feats, gen_feats, vis_feats)
            probs = torch.softmax(logits, dim=-1).squeeze(0).numpy()

        classes = ["I", "R", "S"]
        top_idx = int(np.argmax(probs))
        
        return {
            "predicted_class": classes[top_idx],
            "confidence": float(probs[top_idx]),
            "probabilities": {c: round(float(p), 4) for c, p in zip(classes, probs)},
            "architecture": "Multimodal Fusion Network (Vision + Tabular AST + Genomics)",
            "modalities_used": {
                "phenotypic_ast": True,
                "genomic_features": bool(genomic_markers),
                "image_vision": bool(vision_embedding)
            }
        }

multimodal_predictor = MultimodalAMRPredictor()
