
document.getElementById('formEvento').addEventListener('submit', function(event) {
    
    let nome = document.getElementById('nome')
    let data = document.getElementById('data')
    let descricao = document.getElementById('descricao')
    let local = document.getElementById('local')

    if (nome.value === '' || data.value === '' || descricao.value === '' || local.value === '') {
        alert('Preencha todos os campos para criar o evento!')
        event.preventDefault()

    }
});


