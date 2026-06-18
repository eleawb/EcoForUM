import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { useLocation } from "react-router-dom";
import { Search as SearchIcon, Add as AddIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Paper,
  Card,
  CardContent,
  TextField,
  Stack,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { apiFetch } from '../api';

function DepotFichierMetadonnees(){
  const navigate = useNavigate();
/*
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
Definition des etats
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
*/ 

  const [selectedNumInstrument, setSelectedNumInstrument] = useState<string>(''); //num_instrument
  const [selectedNomInstrument, setSelectedNomInstrument] = useState<string>(''); // nom_outil
  const [numInstrumentDisabled, setNumInstrumentDisabled] = useState(true);
  const [instruments, setInstrumentsDisponibles] = useState<any[]>([]); //liste dinstruments disponibles sur la BDD
  const [nomsInstruments, setNomsInstruments] = useState<any[]>([]);
  const [numsInstrumentsParNoms, setNumsInstrumentsParNoms] = useState<Record<string, string[]>>({});
  const [showAdditionalInputs, setShowAdditionalInputs] = useState<boolean>(false);
  const [selectedResponsable,setSelectedResponsable] = useState<string>('');
  const [responsables, setResponsablesDisponibles] = useState<any[]>([]);
  const [isNewResponsable, setIsNewResponsable] = useState<boolean>(false);//Check si le responsable fichier fut cree pour cet ajout
  const [showCreationRespInputs, setShowCreationRespInputs] = useState<boolean>(false);
  const [nom, setNom] = useState<string>('');
  const [prenom, setPrenom] = useState<string>('');
  const [mail, setMail] = useState<string>('');
  const [extension, setExtension] = useState<string>('');
  //const [dateCollecteForm, setDateCollecteForm] = useState<string>('');
  const [dateCollecteComplete, setDateCollecteComplete] = useState<string>('');
  const [commentaire, setCommentaire] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cheminSelectedFile , setCheminSelectedFile] = useState<string>('');

  const FirstFormComplete = selectedNomInstrument !== '' && selectedNumInstrument !== '';
  const { state } = useLocation();
  let type_script = state.selected;
/*
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
FetchData
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
*/ 
const fetchData = async () => {
            console.log("début du fetch data")
            try {

                //const instrumentsRes = await fetch('http://localhost:3000/api/instruments')
                //const instrumentsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/instruments`)
                //const instrumentsRes = await apiFetch('/api/instruments');
                //const instrumentsData = await instrumentsRes.json()
                //console.log("Instruments reçus du backend:", instrumentsData) 
                //setInstrumentsDisponibles(instrumentsData || [])

                const respononsablesRes = await apiFetch('/api/responsables')
                const respononsablesData = await respononsablesRes.json()
                console.log("Responsables reçus du backend:", respononsablesData)
                setResponsablesDisponibles(respononsablesData || [])

            } catch (error) {
                console.error('Erreur lors du chargement des données:', error)
            }
        }
  //Effectue le call a fetch data une seule fois en page load
  useEffect(() => {
    fetchData();
  }, [])

/*
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
Definition des fonctions
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
*/ 

  
  //Gerer le changement de responsable
  const ResponsableChange = (event: SelectChangeEvent<string>) => {
    const selectedValue = event.target.value;
    setSelectedResponsable(selectedValue);
    setIsNewResponsable(false);//Remet le flag a false quand on prend un responsable autre que celui nouvellement cree
  };

const TodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const hours = String(today.getHours()).padStart(2, '0');
  const minutes = String(today.getMinutes()).padStart(2, '0');
  const secondes = String(today.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${secondes}`;
};

const AutofillDate = () => {
  setDateCollecteComplete(TodayDate());
};

const handleCreateResponsable = async () => {
  //Verifie si les entrees sont remplies
  if (!nom || !prenom || !mail) {
    alert("Veuillez remplir tous les champs (nom, prénom, email)");
    return;
  }

  try {
    const response = await apiFetch('/api/responsable_fichier', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
    nom: nom,
    prenom: prenom,
    email: mail,
    fonction: "responsable_fichier" // toujours un responsable_fichier
    }),
  });

  if (response.ok) {
    const data = await response.json();
    console.log("Responsable fichier créé avec succès");
                  
    // recharger la liste des responsables fichiers disponibles dans la BDD
    fetchData();
                  
    // Remettre le form de creation en blanc
    setNom('');
    setPrenom('');
    setMail('');
    setShowCreationRespInputs(false);

    //Selection automatique du responsable cree
    setSelectedResponsable(data.email);
    setIsNewResponsable(true);//sets la valeur de NewResponsable a true

    } else {
      const error = await response.json();
      alert(`Erreur: ${error.message}`);
    }
    } catch (error) {
      console.error('Error:', error);
      alert("Erreur lors de la création du responsable");
    }
  };

  //Evenement de Submit
  const Submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedFile) {
      console.log('Uploading file:', selectedFile.name)
    }
    else {
      console.log('No file selected')
      alert('Veuillez sélectionner un fichier')
      return
    }

    console.log("Mail responsable :", selectedResponsable)
    // Vérifier que ça fonctionne dans tous les cas !!! (pas que en local)
    const resultat = "./" + cheminSelectedFile.substring(cheminSelectedFile.indexOf("server")).replace(/\\/g, "/");    
    /*console.log("Chemin fichier :", resultat)*/
    console.log("Commentaire :", commentaire)
    console.log("Extension :", extension)
    console.log("type_script :", type_script)

    if (selectedFile){
      sendFormInfo(resultat, selectedResponsable, 
        commentaire, extension, type_script)
    }
  }

//////////////////////////////////Script de verification//////////////////////////////////////////////////

  //autocompletion des champs du form when verification ok
  
//////////////////////////////////Script de verification//////////////////////////////////////////////////

//////////////////////////////////Script d'integration//////////////////////////////////////////////////
const sendFormInfo = async (filePath: string, mail_responsable: string, 
  commentaire: string, extension :string, type_script : string) => {

    try {
      const response = await apiFetch('/api/scriptInteMetadonnees', { //Les routes mènent au serveur index.cjs
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chemin_source: filePath,
          type_script : [type_script],
          extension : extension,
          date_import: TodayDate(),
          commentaire: commentaire,
          mail_responsable : mail_responsable
        }),
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Script integration metadonnees result:', data);
        return data;
      } else {
        console.error('Failed to run integration metadonnees script'); 
        return null;
      }
    } catch (error) {
      console.error('Error running integration metadonnees :', error);
      return null;
    }
  };
//////////////////////////////////Script d'integration//////////////////////////////////////////////////

////////////////////////////Intégration métadonnées////////////////////////////////

///Dépôt du fichier
const DepotFic = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv, .xlsx, .xls';
    fileInput.onchange = async (e: Event) => {
    const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];

        // envoyer le file au back end
        const formData = new FormData();
        formData.append('file', file);
        
        try {
          const response = await apiFetch('/api/upload', {
            method: 'POST',
            body: formData,
        });
          
      if (response.ok) {
        const result = await response.json();
        console.log('Upload success:', result);
        setSelectedFile(file);
        setCheminSelectedFile(result.file.path);
      }
      else {
          alert('Erreur sauvegarde');
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert('Error uploading file');
        }
      }
    };  
    fileInput.click();
};
 



/*
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
REACT
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
*/ 
return(
      <Box sx={{ flexGrow: 1 }}>                         
        <AppBar position="static" sx={{ bgcolor: "#EC9706" }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>DEPOT DE FICHIER</Typography>
            <Button color="inherit" onClick={() => navigate('/')}>Menu</Button>
            <Button color="inherit" onClick={() => navigate('/ajout')}>Retour</Button>
          </Toolbar>
        </AppBar>
        
        <Container maxWidth='md' sx={{ mt: 4 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" margin={2} gutterBottom sx={{ color: '#5d4037' }}>
                <center><b>DÉPÔT DE FICHIER</b></center>
                <br/>
                </Typography>

            <form onSubmit={Submit}>
              <Stack spacing={3}>

              <Button
                  type="button"
                  variant="contained"
                  onClick={DepotFic}
                  sx={{
                    bgcolor: '#EC9706',
                    '&:hover': { bgcolor: '#C78023' },
                  }}
                >
                  SÉLECTION DE FICHIER
                </Button>

                {selectedFile && (
                  <Typography variant="body2" sx={{ color: 'green', textAlign: 'center' }}>
                  Fichier sélectionné: {selectedFile.name}
                  </Typography>
                )}

                {showAdditionalInputs && (
                  <>

                    <FormControl fullWidth required>
                        <InputLabel>Sélectionnez le Responsable du fichier</InputLabel>
                        <Select
                            value={selectedResponsable}
                            id="responsableID" 
                            onChange={ResponsableChange}
                            label="Sélectionnez le Responsable du fichier"
                        >
                            {responsables.slice() // évite de modifier le tableau d'origine
                                .sort((a, b) => {
                                  const nom = a.nom.localeCompare(b.nom);
                          
                                  return nom !== 0
                                      ? nom
                                      : a.prenom.localeCompare(b.prenom);
                                }).map((responsable) => (
                                <MenuItem 
                                    key={responsable.id_personne} 
                                    value={responsable.adresse_mail}
                                >
                                    {responsable.prenom} {responsable.nom} - {responsable.adresse_mail}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button
                    type="button"
                    variant="outlined"
                    onClick={(e) => setShowCreationRespInputs(true)}
                    sx={{ minWidth: '100px', height: '56px' }}
                    >
                    Créer nouveau responsable fichier  
                    </Button>
                    
                   {showCreationRespInputs &&(
                    <>
                   <TextField
                      label="nom"
                      variant="outlined"
                      fullWidth
                      required
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      placeholder="Entrez votre nom"
                    />
                    <TextField
                      label="Prénom"
                      variant="outlined"
                      fullWidth
                      required
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      placeholder="Entrez votre prénom"
                    />
                    <TextField
                      label="Mail"
                      variant="outlined"
                      fullWidth
                      required
                      value={mail}
                      onChange={(e) => setMail(e.target.value)}
                      placeholder="Entrez votre eMail"
                    />
                    <Button
                        type="button"
                        variant="outlined"
                        onClick={handleCreateResponsable}
                        sx={{ minWidth: '100px', height: '56px' }}
                      >
                        Créer
                      </Button>

                    </>
                    )}
                    
                  <Stack direction="row" spacing={2} alignItems="center">
                      <TextField
                        label="Date de collecte"
                        type="datetime-local"
                        variant="outlined"
                        id='date_collecte'
                        fullWidth
                        required
                        value={dateCollecteComplete}
                        onChange={(e) => setDateCollecteComplete(e.target.value.replace("T", " "))}
                        InputLabelProps={{ shrink: true }}
                        inputProps={{
                          step: 1, // autorise les secondes
                        }}
                      />
                      <Button
                        type="button"
                        variant="outlined"
                        onClick={AutofillDate}
                        sx={{ minWidth: '100px', height: '56px' }}
                        >
                        Aujourd'hui
                      </Button>
                    </Stack>

                    <Stack direction="row" spacing={2} alignItems="center">
                      <TextField
                        label="Format (extension)"
                        variant="outlined"
                        id="extension"
                        fullWidth
                        required
                        value={extension}
                        onChange={(e) => setExtension(e.target.value)}
                        placeholder="Extension du fichier"
                      />
                    </Stack>

                    <Stack direction="row" spacing={2} alignItems="center">
                      <TextField
                        label="Commentaire"
                        variant="outlined"
                        id="commentaire"
                        fullWidth
                        value={commentaire}
                        onChange={(e) => setCommentaire(e.target.value)}
                        placeholder="Commentaire sur le fichier"
                      />
                    </Stack>
                  
                  </>
                )}
              
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!selectedFile}
                  sx={{
                    bgcolor: (selectedFile) ? '#EC9706' : '#CCCCCC',
                    '&:hover': {
                      bgcolor: (selectedFile) ? '#C78023' : '#CCCCCC',
                    },
                  }}
                >
                  Déposer
                </Button>
  
              </Stack>
            </form>
          </Paper>
        </Container>
      </Box>
    );
}

export default DepotFichierMetadonnees;