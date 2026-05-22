import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
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

function DepotFichier(){
  const navigate = useNavigate();
/*
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
Definition des etats
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
*/ 

  const [selectedInstrumentId, setSelectedInstrumentId] = useState<number | null>(null);//ID de l instrument
  const [selectedInstrument, setSelectedInstrument] = useState<string>(''); // nom_outil
  const [numInstrument, setNumInstrument] = useState<string>(''); //num_instrument
  const [instruments, setInstrumentsDisponibles] = useState<any[]>([]); //liste dinstruments disponibles sur la BDD
  const [showAdditionalInputs, setShowAdditionalInputs] = useState<boolean>(false);
  const [utilisateur, setUtilisateur] = useState<string>('');
  const [selectedResponsable,setSelectedResponsable] = useState<string>('');
  const [responsables, setResponsablesDisponibles] = useState<any[]>([]);
  const [isNewResponsable, setIsNewResponsable] = useState<boolean>(false);//Check si le repssable fichier fut cree pour cet ajout
  const [showCreationRespInputs, setShowCreationRespInputs] = useState<boolean>(false);
  const [nom, setNom] = useState<string>('');
  const [prenom, setPrenom] = useState<string>('');
  const [mail, setMail] = useState<string>('');
  const [numSerie, setNumSerie] = useState<string>('');
  const [extension, setExtension] = useState<string>('');
  const [dateCueilli, setDateCueilli] = useState<string>('');
  const [dateImport, setDateImport] = useState<string>('');
  const [typeSource, setTypeSource] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const FirstFormComplete = selectedInstrument !== '' && numInstrument !== '';
  const areAdditionalInputsComplete = utilisateur !== '';
/*
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
FetchData
$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
*/ 
const fetchData = async () => {
            console.log("début du fetch data")
            try {

                const instrumentsRes = await fetch('http://localhost:3000/api/instruments')
                const instrumentsData = await instrumentsRes.json()
                console.log("Instruments reçus du backend:", instrumentsData) 
                setInstrumentsDisponibles(instrumentsData || [])

                const respononsablesRes = await fetch('http://localhost:3000/api/responsables')
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

  //Gestion du changement d instrument
  const InstrumentChange = (event: SelectChangeEvent<string>) => {
    const selectedId = parseInt(event.target.value);
    if (isNaN(selectedId)) return //si conversion pas réussie
    setSelectedInstrumentId(selectedId);
  
      const instrument = instruments.find(i => i.id_instrument === selectedId);
      if (instrument) {
        setSelectedInstrument(instrument.nom_outil || ''); // Store nom_outil
        setNumInstrument(instrument.num_instrument?.toString() || '');   
    }
  };
  const FileUpload = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv, .xlsx, .xls, .png, .wav';
    fileInput.onchange = async (e: Event) => {
    const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];

        // envoyer le file au back end
        const formData = new FormData();
        formData.append('file', file);
        
        try {
          const response = await fetch('http://localhost:3000/api/upload', {
            method: 'POST',
            body: formData,
        });
          
      if (response.ok) {
        const result = await response.json();
        console.log('Upload success:', result);

        //Verification avant de passer au reste du FORM
        const verificationResult = await sendInstrumentInfo(
            selectedInstrument, 
            numInstrument, 
            result.file.path// 
          ); //si reusite de verification, montrer le reste des inputs
        if (verificationResult && verificationResult.reussite === true) {
            setSelectedFile(file);
            setShowAdditionalInputs(true);
            console.log('Verification passed:', verificationResult.commentaire);

          //Appel a la fonction d'autocompletion
          autocompletion(verificationResult);

      }else {
            //on ne montres pas le reste des inputs
            const errorMsg = verificationResult?.commentaire || 'Verification failed';
            alert(`Verification failed: ${errorMsg}`);
        }
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
  //Gerer le changement de responsable
  const ResponsableChange = (event: SelectChangeEvent) => {
    const selectedValue = event.target.value;
    setSelectedResponsable(selectedValue);
    setIsNewResponsable(false);//Remet le flag a false quand on prend un responsable autre que celui nouvellement cree
};

const AutofillDate = () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      setDateImport(`${year}-${month}-${day}`);
    };

const handleCreateResponsable = async () => {
  //Verifie si les entrees sont remplies
  if (!nom || !prenom || !mail) {
    alert("Veuillez remplir tous les champs (nom, prénom, email)");
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/api/responsable_fichier', {
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

      console.log('Instrument:', selectedInstrument);
      if (selectedFile) {

      console.log('Uploading file:', selectedFile.name)
      }else {
        console.log('No file selected')
        alert('Veuillez sélectionner un fichier')
        return
    }
  }

//////////////////////////////////Script de verification//////////////////////////////////////////////////
  const sendInstrumentInfo = async (nom_outil: string, num_instrument: string, filePath: string) => {
    
    try {
      {/*console.log(nom_outil,num_instrument);*/}
      const response = await fetch('http://localhost:3000/api/scriptVerif', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nom_outil: nom_outil,
          num_instrument: num_instrument,
          chemin_source: filePath
        }),
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Script verification result:', data);
        return data;
      } else {
        console.error('Failed to run verification script'); 
        return null;
      }
    } catch (error) {
      console.error('Error running verification:', error);
      return null;
    }
  };

  //autocompletion des champs du form when verification ok
  const autocompletion = (verificationData: any) => {
  if (verificationData && verificationData.reussite === true) {
    // completion du Numéro de série
    if (verificationData.numero_serie) {
      setNumSerie(verificationData.numero_serie);
    }
    // completion de Date de cueilli 
    if (verificationData.date_recueil) {
      //formattage de la date problemes avec le format du HOBO
      const dateStr = verificationData.date_recueil;
      if (dateStr.length === 8) {
        const formattedDate = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
        setDateCueilli(formattedDate);
      } else {
        setDateCueilli(dateStr);
      }
    }
    // completion Extension
    if (verificationData.extension) {
      setExtension(verificationData.extension);
    }
    // completion Type source
    if (verificationData.type_source) {
      setTypeSource(verificationData.type_source);
    }
    
    console.log('Form autocompleté avec le JSON de verification SUCCESS');
  }
};
//////////////////////////////////Script de verification//////////////////////////////////////////////////

//////////////////////////////////Script d'integration//////////////////////////////////////////////////
const sendFormInfo = async (nom_outil: string, type_source: string, num_instrument: string, filePath: string,
   num_serie: string, extension :string, date_recueil: Date, date_import:Date) => {


      const select = document.getElementById("responsableID");
      const numero = select.selectedIndex;

    
    try {
      
      const response = await fetch('http://localhost:3000/api/scriptInte', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chemin_source: filePath,
          type_source: type_source,
          nom_outil: nom_outil,
          num_instrument: num_instrument,
          num_serie : num_serie,
          extension : extension,
          date_recueil : date_recueil,
          date_import: date_import,
          mail_responsable : responsables[numero].adresse_mail,

        }),
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Script integration result:', data);
        return data;
      } else {
        console.error('Failed to run integration script'); 
        return null;
      }
    } catch (error) {
      console.error('Error running integration:', error);
      return null;
    }
  };
//////////////////////////////////Script d'integration//////////////////////////////////////////////////


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

              <FormControl fullWidth required>
              <InputLabel>Sélectionnez l'instrument pour lequel vous souhaitez déposer un fichier</InputLabel>
              <Select
                value={selectedInstrumentId?.toString() || ''} 
                onChange={InstrumentChange}
                label="Sélectionnez l'instrument pour lequel vous souhaitez déposer un fichier"
              >
                {instruments.map((instrument) => (
                  <MenuItem 
                    key={instrument.id_instrument} 
                    value={instrument.id_instrument}
                  >
                    {instrument.nom_outil} - {instrument.num_instrument}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

              <TextField
              label="Numéro de l'instrument"
              variant="outlined"
              fullWidth
              required
              value={numInstrument}
              disabled // pas editable par securite 
              InputProps={{
                readOnly: true,
              }}
            />

              <Button
                  type="button"
                  variant="contained"
                  onClick={FileUpload}
                  disabled = {!FirstFormComplete}
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
                      
                    <TextField
                      label="Utilisateur"
                      variant="outlined"
                      fullWidth
                      required
                      value={utilisateur}
                      onChange={(e) => setUtilisateur(e.target.value)}
                      placeholder="Qui veut déposer le fichier"
                    />

                    <FormControl fullWidth required>
                        <InputLabel>Sélectionnez le Responsable_fichier</InputLabel>
                        <Select
                            value={selectedResponsable}
                            id="responsableID" 
                            onChange={ResponsableChange}
                            label="Sélectionnez le Responsable_fichier"
                        >
                            {responsables.map((responsable) => (
                                <MenuItem 
                                    key={responsable.id_personne} 
                                    value={responsable.adresse_mail}
                                >
                                    {responsable.nom} {responsable.prenom}
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
                    
                    <TextField
                          label="Numéro de série"
                          variant="outlined"
                          fullWidth
                          required
                          value={numSerie}
                          onChange={(e) => setNumSerie(e.target.value)}
                          placeholder="Entrez le numéro de série"
                      />
                    
                  <Stack direction="row" spacing={2} alignItems="center">
                      <TextField
                        label="Date de cueillie"
                        type="date"
                        variant="outlined"
                        fullWidth
                        required
                        value={dateCueilli}
                        onChange={(e) => setDateCueilli(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Stack>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <TextField
                        label="Date d'import"
                        type="date"
                        variant="outlined"
                        fullWidth
                        required
                        value={dateImport}
                        onChange={(e) => setDateImport(e.target.value)}
                        InputLabelProps={{ shrink: true }}
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
                        fullWidth
                        required
                        value={extension}
                        onChange={(e) => setExtension(e.target.value)}
                        placeholder="Extension du fichier"
                      />
                    </Stack>

                    <FormControl fullWidth required>
                    <InputLabel>Type source</InputLabel>
                    <Select
                      value={typeSource}
                      onChange={(e) => setTypeSource(e.target.value)}
                      label="Type source"
                    >
                    <MenuItem value="fichier_mesure">fichier_mesure</MenuItem>
                    <MenuItem value="dossier_audio">dossier_audio</MenuItem>
                    <MenuItem value="dossier_image">dossier_image</MenuItem>
                    </Select>
                    </FormControl>
                  
                  </>
                )}
              
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!FirstFormComplete || !selectedFile || !areAdditionalInputsComplete}
                  sx={{
                    bgcolor: (FirstFormComplete && selectedFile && areAdditionalInputsComplete) ? '#EC9706' : '#CCCCCC',
                    '&:hover': {
                      bgcolor: (FirstFormComplete && selectedFile && areAdditionalInputsComplete) ? '#C78023' : '#CCCCCC',
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

export default DepotFichier;