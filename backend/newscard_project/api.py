from rest_framework import viewsets, serializers
from apps.customers.models import Customer
from apps.rounds.models import Round
from apps.publications.models import Publication
from django.contrib.auth.models import User

class StandardSerializer(serializers.ModelSerializer):
    class Meta:
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at')

class CustomerSerializer(StandardSerializer):
    round_name = serializers.CharField(source='round.name', read_only=True)
    round_id = serializers.PrimaryKeyRelatedField(
        source='round', queryset=Round.objects.all(), required=False, allow_null=True
    )
    address = serializers.CharField(write_only=True, required=False, allow_blank=True)
    street = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    address1 = serializers.CharField(required=False, allow_blank=True)
    class Meta(StandardSerializer.Meta):
        model = Customer
        read_only_fields = StandardSerializer.Meta.read_only_fields + ('ac_number',)

    def to_internal_value(self, data):
        data = data.copy()
        if 'address' in data:
            data['address1'] = data.pop('address')
        return super().to_internal_value(data)

    def create(self, validated_data):
        validated_data.pop('street', None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop('street', None)
        return super().update(instance, validated_data)

class RoundSerializer(StandardSerializer):
    customer_count = serializers.IntegerField(read_only=True, default=0)
    customer_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    customer_name = serializers.SerializerMethodField()

    class Meta(StandardSerializer.Meta):
        model = Round

    def get_customer_name(self, obj):
        # We fetch the first associated customer. If the user only assigns one, this works perfectly.
        first_customer = obj.customer_set.first()
        return first_customer.name if first_customer else ""

    def create(self, validated_data):
        customer_id = validated_data.pop('customer_id', None)
        instance = super().create(validated_data)
        if customer_id:
            Customer.objects.filter(id=customer_id).update(round=instance)
        return instance

    def update(self, instance, validated_data):
        customer_id = validated_data.pop('customer_id', None)
        instance = super().update(instance, validated_data)
        # If customer_id is provided in the request payload (even as None/0)
        if 'customer_id' in self.initial_data:
            # Unlink existing customers from this round
            Customer.objects.filter(round=instance).update(round=None)
            # Link the newly selected one
            if customer_id:
                Customer.objects.filter(id=customer_id).update(round=instance)
        return instance

class PublicationSerializer(StandardSerializer):
    product_type = serializers.CharField(source='type', required=False)
    class Meta(StandardSerializer.Meta):
        model = Publication

class BaseViewSet(viewsets.ModelViewSet):
    def perform_create(self, serializer):
        user = User.objects.first()
        if not user:
            user, _ = User.objects.get_or_create(username='admin')
        serializer.save(created_by=user)

class CustomerViewSet(BaseViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    def get_queryset(self):
        from django.db.models import Q
        q = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            query = Q(name__icontains=search) | Q(phone__icontains=search) | Q(email__icontains=search) | Q(address1__icontains=search) | Q(address2__icontains=search) | Q(street__name__icontains=search)
            if search.isdigit():
                query |= Q(ac_number=int(search))
            q = q.filter(query)
        return q

class RoundViewSet(BaseViewSet):
    queryset = Round.objects.all()
    serializer_class = RoundSerializer

    def get_queryset(self):
        from django.db.models import Count, Q
        q = super().get_queryset().annotate(customer_count=Count('customer'))
        search = self.request.query_params.get('search')
        if search:
            q = q.filter(
                Q(name__icontains=search) |
                Q(paperboy__icontains=search) |
                Q(notes__icontains=search)
            )
        return q

class PublicationViewSet(BaseViewSet):
    queryset = Publication.objects.all()
    serializer_class = PublicationSerializer
    def get_queryset(self):
        from django.db.models import Q
        q = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            q = q.filter(
                Q(name__icontains=search) |
                Q(supplier__icontains=search) |
                Q(sku__icontains=search) |
                Q(type__icontains=search)
            )
        return q
