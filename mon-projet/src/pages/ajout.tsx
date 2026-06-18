import { useState } from 'react'
import { useNavigate } from 'react-router-dom' //pr navigation
import { Search as SearchIcon, Add as AddIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material' //icônes visuelles
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container, //centrer avec des marges
  Box, //conteneur principal
  Paper,
  Card,
  CardContent,
  TextField,
  Stack, //aligner boutons en colonne par ex
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material' //import MUI
import { apiFetch } from '../api';

function Ajout() {
    const navigate = useNavigate()
    
    const options = ["Personne", "Instrument", "Projet", "Mesures", "Variable Mesurée"].sort()

    // pour créer une variable d'état possédant un id : selected et une fonction permettant le placement de la valeur de la variable
    type ActivationKey = keyof typeof activation

    const [selected, setSelected] = useState<ActivationKey | "">("")
    //const [selected, setSelected] = useState("")

    const activation = {
    "Personne": { semiAuto: false, auto: true, manuelle: true },
    "Instrument": { semiAuto: false, auto: true, manuelle: true },
    "Projet": { semiAuto: false, auto: true, manuelle: true },
    "Mesures": { semiAuto: true, auto: true, manuelle: false },
    "Variable Mesurée": { semiAuto: false, auto: false, manuelle: true }
    }

    const permissions = 
    selected !== ""
    ? activation[selected]
    : { semiAuto: false, auto: false, manuelle: false }

    const routes = {
  "Personne": {
    semiAuto: "",
    auto: "/depotFichierMetadonnees",
    manuelle: "",
  },
  "Instrument": {
    semiAuto: "",
    auto: "/depotFichierMetadonnees",
    manuelle: "",
  },
  "Projet": {
    semiAuto: "",
    auto: "/depotFichierMetadonnees",
    manuelle: "",
  },
  "Mesures": {
    semiAuto: "",
    auto: "/depotFichier",
    manuelle: "",
  },
  "Variable Mesurée": {
    semiAuto: "",
    auto: "",
    manuelle: "/variable-mesuree/manuelle",
  },
} as const;


    const handleClick = (mode : "semiAuto" | "auto" | "manuelle") => {
      if (!selected) return;
      const route = routes[selected][mode];
      navigate(route, {state: { selected }});
    };

    return (
        <Box sx={{ flexGrow: 1 }}> 

        {/*barre navigation*/}                        
        <AppBar position="static"
        sx={{
          bgcolor:"#EC9706",
        }}
        >
              <Toolbar> {/*pr que les éléments soient à côté dans la barre nav*/}
                  <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>AJOUTER DES DONNÉES</Typography>
                  <Button color="inherit" onClick={() => navigate('/')}>Retour</Button> {/*retour menu*/}
          
              </Toolbar>
          </AppBar>


        {/*choix d'ajout de données*/}
        <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={4} sx={{ p: 4 }}> 
        <Typography variant="h5" margin={2} gutterBottom sx={{ color: '#5d4037' }}>
                  <center><b>VEUILLEZ CHOISIR UNE MÉTHODE :</b></center>
                  <br></br>
        </Typography>       

        {/*Liste déroulante pour choisir le type de fichier que l'on veut intégrer : personnes, instruments, projets ou mesures */}
        <FormControl fullWidth sx={{ mb: 4 }} required>
          <InputLabel>Type de fichier à intégrer</InputLabel>
          <Select
            value={selected}
            label="Type de fichier à intégrer"
            onChange={(e) => setSelected(e.target.value as ActivationKey)}
          >
            {options.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </Select>
        </FormControl>


        <Stack direction="row" spacing={2} justifyContent="center"> {/*les choix seront alignés l'un dessus l'autre*/}

            {/* saisie semi-automatique */}
            <Button
                type="submit"
                variant="contained"
                startIcon={<AddIcon />} //icône + 
                onClick={() => handleClick("semiAuto")}//redirection vers les depots
                disabled={!permissions.semiAuto}
              sx={{
              bgcolor:'#EC9706',
              '&:hover': { bgcolor: '#C78023' }, //quand on passe dessus, couleur plus foncée
            }}
              >
                Saisie semi-automatique
              </Button>

            {/*dépôt de fichier*/}
          <Button
                type="submit"
                variant="contained"
                startIcon={<AddIcon />} //icône + 
                onClick={() => handleClick("auto")}//redirection vers les depots
                disabled={!permissions.auto}
              sx={{
              bgcolor:'#EC9706',
              '&:hover': { bgcolor: '#C78023' }, //quand on passe dessus, couleur plus foncée
            }}
              >
                Saisie Automatique
              </Button>

            {/*saisie manuelle*/}
              <Button
                type="submit"
                onClick={() => handleClick("manuelle")} //redirection saisieManuelle
                variant="contained"
                startIcon={<AddIcon />}  //icônes +
                disabled={!permissions.manuelle}
              sx={{
              bgcolor:'#EC9706',
              '&:hover': { bgcolor: '#C78023' }, //quand on passe dessus, couleur plus foncée
            }}
              >
                Saisie manuelle
              </Button>

        </Stack>
        </Paper>
        </Container>
        </Box>
      )
  }

export default Ajout